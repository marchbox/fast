import { defineConfig } from "vite";
import istanbul from "vite-plugin-istanbul";

export default defineConfig({
    clearScreen: false,
    plugins: [
        istanbul({
            include: ["src/*"],
            exclude: ["node_modules"],
            extension: [".js", ".ts", ".map"],
            forceBuildInstrument: true,
        }),
    ],
    resolve: {
        conditions: ["test"],
    },
    server: {
        strictPort: true,
        debug: true,
    },
    build: {
        outDir: "./dist",
        minify: false,
        sourcemap: true,
    },
    preview: {
        port: 5173,
    },
});
