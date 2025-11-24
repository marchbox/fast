import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    retries: 3,
    fullyParallel: true,
    use: {
        contextOptions: {
            reducedMotion: "reduce",
        },
    },
    projects: [
        { name: "chromium", use: devices["Desktop Chrome"] },
        { name: "edge", use: devices["Desktop Edge"] },
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
    testMatch: "src/**/*.pw.spec.ts",
    webServer: {
        command: "npm run --if-present build:vite && npm run test:preview",
        port: 5173,
        reuseExistingServer: true,
        stdout: "pipe",
        stderr: "pipe",
    },
});
