import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    retries: 3,
    fullyParallel: true,
    projects: [
        { name: "chromium", use: devices["Desktop Chrome"] },
        { name: "firefox", use: devices["Desktop Firefox"] },
        {
            name: "webkit",
            use: {
                ...devices["Desktop Safari"],
                deviceScaleFactor: 1,
            },
        },
    ],
    reporter: "list",
    testDir: ".",
    testMatch: "**/*.spec.ts",
    webServer: {
        command: "npm run --if-present test:server",
        port: 5173,
        reuseExistingServer: true,
        stdout: "pipe",
        stderr: "pipe",
    },
});
