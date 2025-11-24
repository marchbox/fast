import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { test as baseTest } from "@playwright/test";
import { FASTFixture } from "./fast-fixture.js";

declare global {
    interface Window {
        __coverage__: Record<string, unknown>;
        collectIstanbulCoverage(coverage: string): void;
    }
}

const isSSR = process.env.PLAYWRIGHT_TEST_SSR === "true";

const istanbulCLIOutput = path.join(process.cwd(), ".nyc_output");

export function generateUUID(): string {
    return crypto.randomBytes(16).toString("hex");
}

type FixtureOptions = {
    /**
     * Additional HTML to insert into the element.
     */
    innerHTML: string;

    /**
     * Indicates if the test is running in SSR mode.
     */
    ssr: boolean;

    /**
     * The tag name of the custom element to test.
     */
    tagName: string;

    /**
     * Additional custom elements to wait for before running the test.
     */
    waitFor: string[];
};

type Fixtures = {
    fastPage: FASTFixture;
};

export const test = baseTest.extend<Fixtures & FixtureOptions>({
    innerHTML: ["", { option: true }],

    tagName: ["", { option: true }],

    waitFor: [[], { option: true }],

    ssr: [!!isSSR, { option: true }],

    fastPage: async ({ page, innerHTML, ssr, tagName, waitFor }, use) => {
        const fastPage = new FASTFixture(page, tagName, innerHTML, ssr);

        if (!ssr) {
            await fastPage.goto();
            await fastPage.waitForCustomElement(tagName, ...waitFor);
        }

        await use(fastPage);
    },

    context: async ({ context }, use) => {
        await context.addInitScript(() =>
            window.addEventListener("beforeunload", () =>
                window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))
            )
        );
        await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
        await context.exposeFunction(
            "collectIstanbulCoverage",
            (coverageJSON: string) => {
                if (coverageJSON)
                    fs.writeFileSync(
                        path.join(
                            istanbulCLIOutput,
                            `playwright_coverage_${generateUUID()}.json`
                        ),
                        coverageJSON
                    );
            }
        );
        await use(context);
        for (const page of context.pages()) {
            await page.evaluate(() =>
                window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))
            );
        }
    },
});
