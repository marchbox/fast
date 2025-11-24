import { URLSearchParams } from "node:url";
import type { Locator, Page } from "@playwright/test";

type TemplateOrOptions =
    | string
    | {
          attributes?: Record<string, string | true>;
          innerHTML?: string;
      };

/**
 * A fixture for testing FAST components.
 */
export class FASTFixture {
    /**
     * The Playwright locator for the custom element.
     */
    public readonly element: Locator;

    /**
     * The tag name of the custom element.
     */
    protected readonly tagName: string;

    /**
     * The inner HTML of the custom element.
     */
    protected readonly innerHTML: string;

    protected readonly ssr: boolean;

    protected readonly waitFor: string[];

    constructor(
        public readonly page: Page,
        tagName: string,
        innerHTML: string,
        ssr: boolean = false,
        waitFor: string[] = []
    ) {
        this.ssr = ssr;
        this.tagName = tagName;
        this.innerHTML = innerHTML;
        this.element = this.page.locator(this.tagName);
        this.waitFor = waitFor;

        this.page.emulateMedia({ reducedMotion: "reduce" });
    }

    async goto(url: string = "/") {
        await this.page.goto(url);
    }

    private defaultTemplate(
        tagName: string = this.tagName,
        attributes: Record<string, string | true> = {},
        innerHTML: string = this.innerHTML
    ) {
        const attributesString = Object.entries(attributes)
            .map(([key, value]) => {
                if (value === true) {
                    return key;
                }

                return `${key}="${value.replace(/"/g, "")}"`;
            })
            .join(" ");

        return `<${tagName} ${attributesString}>${innerHTML}</${tagName}>`;
    }

    async setTemplate(templateOrOptions?: TemplateOrOptions): Promise<void> {
        const body = this.page.locator("body");

        if (this.ssr) {
            await this.setSSRTemplate(templateOrOptions);
        } else {
            const template =
                typeof templateOrOptions === "string"
                    ? templateOrOptions
                    : this.defaultTemplate(
                          this.tagName,
                          templateOrOptions?.attributes,
                          templateOrOptions?.innerHTML
                      );

            await body.evaluate((node, template) => {
                const fragment = document
                    .createRange()
                    .createContextualFragment(template);
                node.innerHTML = "";
                node.append(fragment);
            }, template);
        }

        if ((await this.element.count()) > 0) {
            (
                await this.page.locator([this.tagName, ...this.waitFor].join(",")).all()
            ).forEach(async element => {
                await element.waitFor({
                    state: "attached",
                    timeout: 1000,
                });
            });
        }

        await (await body.elementHandle())?.waitForElementState("stable");
    }

    async setSSRTemplate(templateOrOptions?: TemplateOrOptions): Promise<void> {
        const params = new URLSearchParams();
        let url = "/ssr?";
        let innerHTML = this.innerHTML;

        if (typeof templateOrOptions === "string") {
            params.set("html", templateOrOptions.replace(/\s+/g, " ").trim());
        }

        if (typeof templateOrOptions === "object") {
            if (templateOrOptions.innerHTML) {
                innerHTML = templateOrOptions.innerHTML;
            }

            if (templateOrOptions.attributes) {
                const cleanedAttributes: Record<string, string | true> = {};
                Object.entries(templateOrOptions.attributes).forEach(([key, value]) => {
                    cleanedAttributes[key.trim()] = (value as string).trim?.() ?? value;
                });
                params.set("attributes", JSON.stringify(cleanedAttributes));
            }
        }

        if (!params.has("html")) {
            params.set("tagName", this.tagName);
            params.set("innerHTML", innerHTML);
        }

        params.forEach((value, key) => {
            if (typeof value === "string") {
                params.set(key, value.replace(/\s+/g, " ").trim());
            }
        });

        url = url.concat(params.toString());
        await this.page.goto(url);
    }

    async updateTemplate(
        locator: string | Locator,
        options: {
            attributes?: Record<string, string | boolean>;
            innerHTML?: string;
        }
    ): Promise<void> {
        const element =
            typeof locator === "string" ? this.page.locator(locator) : locator;

        await element.evaluateHandle((node, options) => {
            if (options.innerHTML) {
                node.innerHTML = options.innerHTML;
            }

            if (options.attributes) {
                const attributesAsJSON = options.attributes;

                Object.entries(attributesAsJSON).forEach(
                    ([key, value]: [string, string | boolean]) => {
                        if (value === true) {
                            node.setAttribute(key, "");
                        } else if (value === false) {
                            node.removeAttribute(key);
                        } else if (typeof value === "string") {
                            node.setAttribute(key, value);
                        }
                    }
                );
            }
        }, options);
    }

    async waitForCustomElement(tagName: string = this.tagName, ...tagNames: string[]) {
        if (!tagName && !tagNames.length) {
            return;
        }

        await this.page.waitForFunction(
            (tagNames: string[]) =>
                Promise.all(tagNames.map(t => customElements.whenDefined(t))),
            [tagName, ...tagNames]
        );
    }
}
