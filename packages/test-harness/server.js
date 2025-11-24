import fs from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import istanbul from "vite-plugin-istanbul";

const __dirname = fileURLToPath(dirname(import.meta.url));

const PORT = process.env.PORT || 5173;
const base = process.env.BASE || "/";

export const app = express();

export async function startServer(cwd = process.cwd()) {
    const root = resolve(cwd, "./test");
    const indexPath = resolve(root, "./index.html");

    const { createServer } = await import("vite");

    const vite = await createServer({
        root,
        server: { middlewareMode: true },
        appType: "custom",
        resolve: { conditions: ["test", "default", ""] },
        ssr: { resolve: { conditions: ["test", ""] } },
        publicDir: resolve(__dirname, "./public"),
        plugins: [
            istanbul({
                include: ["src/*"],
                exclude: ["node_modules"],
                extension: [".js", ".ts", ".map"],
                forceBuildInstrument: true,
            }),
        ],
    });

    app.use(vite.middlewares);

    app.use("/ssr", async (req, res, next) => {
        const url = req.originalUrl.replace(base, "");
        const getQuery = req.query;

        try {
            const templateFile = await fs.readFile(
                resolve(root, "./ssr.html"),
                "utf-8",
            );
            const page = await vite.transformIndexHtml(url, templateFile);

            const { render } = await vite.ssrLoadModule("/src/entry-server.js");

            const { template: templates, fixture } = await render(getQuery);

            const html = page
                .replace("<!--templates-->", templates ?? "")
                .replace("<!--fixture-->", fixture ?? "");

            res.status(200).set({ "Content-Type": "text/html" }).send(html);
        } catch (e) {
            vite?.ssrFixStacktrace?.(e);
            console.log(e.stack);
            res.status(500).end(e.stack);
        }
    });

    app.use("*all", async (req, res) => {
        try {
            const url = req.originalUrl.replace(base, "");

            const indexHtml = await fs.readFile(indexPath, "utf-8");
            const index = await vite.transformIndexHtml(url, indexHtml);
            res.status(200).set({ "Content-Type": "text/html" }).send(index);
        } catch (e) {
            vite?.ssrFixStacktrace?.(e);
            console.log(e.stack);
            res.status(500).end(e.stack);
        }
    });

    app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
}

