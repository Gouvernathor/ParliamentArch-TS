import { GetSeatsCentersOptions } from "./geometry.js";
import { getSVGFromAttribution } from "./index.js";
import { GetGroupedSVGOptions, SeatData, SeatDataWithNumber } from "./svg.js";

const partyInnerTagsLowercase = new Set([
    "party",
    "group",
    "seat-data",
]);
const optionsInnerTagsLowercaseCollapsed = new Set([
    "options",
    "paoptions",
    "parliamentarchoptions",
]);

type AllOptions = Partial<GetSeatsCentersOptions & GetGroupedSVGOptions & { seatRadiusFactor: number }>;

const numberOptions = new Set([
    "canvasSize",
    "fontSizeFactor",
    "minNRows",
    "spanAngle",
    "seatRadiusFactor",
]);

/**
 * This element will generate a parliament arch SVG. Its tag name is `<parliament-arch>`.
 * It takes the same data as `getSVGFromAttribution`, in two possible ways:
 * - through its constructor, with the same signature as `getSVGFromAttribution`
 * - through its children.
 *
 * When passed through its children, there may be one or multiple party nodes and zero or one options node.
 *
 * The party nodes may be `<party>`, `<group>`, or `<seat-data>`,
 * and their attributes are the same as the properties of `SeatData` (in kebab-case, not camelCase).
 * The number of seats of the party may be specified either through the `n-seats` attribute or through the text content of the node.
 * As with `SeatData`, the color is required.
 * If any party node is present, the parties passed through the constructor are ignored.
 *
 * The options node may be `<options>`, `<paoptions>`, or `<parliamentarchoptions>`,
 * with dashes inserted anywhere in the name (for instance, `<parliament-arch-options>`).
 * There should not be several options nodes.
 * Its attributes are the same as the options taken by `getSVGFromAttribution`,
 * but this time in camelCase and not kebab-case.
 * Any option passed through the children overrides the options passed through the constructor.
 */
export class Parliamentarch extends HTMLElement {
    #shadow;
    #attribution: readonly SeatDataWithNumber[] | Map<SeatData, number>;
    #options: AllOptions;
    #observer;

    constructor(
        attribution: readonly SeatDataWithNumber[] | Map<SeatData, number> = [],
        options: AllOptions = {},
    ) {
        super();
        this.#shadow = this.attachShadow({ mode: "open" });
        this.#attribution = attribution;
        this.#options = options;

        // Setup MutationObserver to watch child changes
        this.#observer = new MutationObserver(() => this.updateData());

        // this.render(); // not recommended in the constructor
    }

    connectedCallback() {
        // Start observing when the component is added to the DOM
        this.#observer.observe(this, { childList: true });

        // Initial data processing
        this.updateData();
    }

    disconnectedCallback() {
        // Stop observing when removed from the DOM
        this.#observer.disconnect();
    }

    updateData() {
        // Extract data from child elements
        const attribution = Array.from(this.children, child => {
            if (partyInnerTagsLowercase.has(child.tagName.toLowerCase())) {
                const color = child.getAttribute("color");
                if (!color) {
                    throw new Error(`<${child.tagName.toLowerCase()}> is missing the required "color" attribute.`);
                }
                const borderSizeStr = child.getAttribute("border-size");
                const nSeatsStr = child.getAttribute("n-seats") ?? child.textContent;
                return {
                    color,
                    id: child.getAttribute("id") || undefined,
                    data: child.getAttribute("data") || undefined,
                    borderSize: borderSizeStr ? +borderSizeStr : undefined,
                    borderColor: child.getAttribute("border-color") || undefined,
                    nSeats: nSeatsStr ? +nSeatsStr : undefined,
                };
            }
            return null;
        }).filter(party => party !== null);
        if (attribution.length > 0) {
            this.#attribution = attribution;
        }

        for (const child of this.children) {
            const lowercaseReplaced = child.tagName.toLowerCase().replace(/-/g, "");
            if (optionsInnerTagsLowercaseCollapsed.has(lowercaseReplaced)) {
                const newOptions: any = {};
                for (const attr of child.attributes) {
                    const name = attr.name.toLowerCase();
                    const strValue = attr.value;
                    if (numberOptions.has(name)) {
                        newOptions[name] = +strValue;
                    } else if (name === "margins") {
                        const parts = strValue.split(",").map(s => +s.trim());
                        if (parts.length === 1) {
                            newOptions.margins = parts[0];
                        } else {
                            newOptions.margins = parts;
                        }
                    } else if (name === "writeNumberOfSeats") {
                        newOptions.writeNumberOfSeats = strValue.toLowerCase() === "true";
                    } else {
                        newOptions[name] = strValue;
                    }
                }
                this.#options = { ...this.#options, ...newOptions };
                break; // only consider the first options-like tag
            }
        }

        this.render();
    }

    render() {
        this.#shadow.replaceChildren();
        let svgElement;
        try {
            svgElement = getSVGFromAttribution(this.#attribution, this.#options);
        } catch (error) {
            console.error("Error rendering SVG:", error);
        }
        if (svgElement) {
            this.#shadow.appendChild(svgElement);
        }
    }
}

// Define the custom element
customElements.define("parliament-arch", Parliamentarch);
