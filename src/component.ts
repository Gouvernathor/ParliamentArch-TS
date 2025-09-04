import { FillingStrategy, GetSeatsCentersOptions } from "./geometry.js";
import { getSVGFromAttribution } from "./index.js";
import { GetGroupedSVGOptions, SeatData, SeatDataWithNumber } from "./svg.js";

const partyInnerTagsLowercase = new Set([
    "party",
    "group",
    "seat-data",
]);

type AllOptions = Partial<GetSeatsCentersOptions & GetGroupedSVGOptions & { seatRadiusFactor: number }>;

/**
 * This element will generate a parliament arch SVG. Its tag name is `<parliament-arch>`.
 * It takes the same data as `getSVGFromAttribution`, in two possible ways:
 * - through its constructor, with the same signature as `getSVGFromAttribution`
 * - through its attributes and children.
 *
 * The attributes set the options. They are of the form `data-*`,
 * where `*` is the kebab-case version of the option name.
 * For example, `data-seat-radius-factor="0.8"` sets the `seatRadiusFactor` option to 0.8.
 * The attributes override the values set in the constructor.
 *
 * When passed through its children, there may be one or multiple party nodes.
 * The party nodes may be `<party>`, `<group>`, or `<seat-data>`.
 * The attributes are of the form data-*, where `*` is the kebab-case version of the property name.
 * For example, `data-border-size="0.05"` sets the `borderSize` property to 0.05,
 * and `data-data="Some info"` sets the `data` property to "Some info".
 * The number of seats of the party may be specified
 * either through the `data-n-seats` attribute or through the text content of the node.
 * As with `SeatData`, the color (`data-color`) is required.
 * If any party node is present, the parties passed through the constructor are discarded.
 */
export class ParliamentArch extends HTMLElement {
    // The options
    static observedAttributes = [
        "data-seat-radius-factor", // number

        "data-min-n-rows", // number
        "data-filling-strategy",
        "data-span-angle", // number

        "data-canvas-size", // number
        "data-margins",
        "data-write-number-of-seats",
        "data-font-size-factor", // number
    ];

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
        this.#observer = new MutationObserver(() => this.updateAttribution());

        // this.render(); // not recommended in the constructor
    }

    connectedCallback() {
        // Start observing when the component is added to the DOM
        this.#observer.observe(this, { childList: true });

        // Initial data processing
        this.updateAttribution();
    }

    disconnectedCallback() {
        // Stop observing when removed from the DOM
        this.#observer.disconnect();
    }

    attributeChangedCallback(_name: string, _oldValue: string|null, _newValue: string|null) {
        this.updateOptions(this.dataset);
    }

    private updateOptions(data: DOMStringMap) {
        for (const numberOption of ["seatRadiusFactor", "minNRows", "spanAngle", "canvasSize", "fontSizeFactor"] as const) {
            if (numberOption in data) {
                const value = +(data[numberOption]!);
                if (!Number.isNaN(value)) {
                    this.#options[numberOption] = value;
                }
            }
        }
        for (const booleanOption of ["writeNumberOfSeats"] as const) {
            if (booleanOption in data) {
                const value = data[booleanOption]!.toLowerCase();
                this.#options[booleanOption] = value === "true";
            }
        }
        for (const stringOption of ["fillingStrategy"] as const) {
            if (stringOption in data) {
                const value = data[stringOption]!;
                if (value in Object.values(FillingStrategy)) {
                    this.#options[stringOption] = value as FillingStrategy;
                }
            }
        }
        if ("margins" in data) {
            const parts = data["margins"]!.split(",").map(s => +s.trim());
            if (!parts.some(p => Number.isNaN(p))) {
                if (parts.length === 1) {
                    this.#options.margins = parts[0]!;
                } else if (parts.length === 2) {
                    this.#options.margins = [parts[0]!, parts[1]!];
                } else if (parts.length === 4) {
                    this.#options.margins = [parts[0]!, parts[1]!, parts[2]!, parts[3]!];
                }
            }
        }
    }

    private updateAttribution() {
        // Extract attribution data from child elements
        const attribution = Array.from(this.children, child => {
            if (child instanceof HTMLElement && partyInnerTagsLowercase.has(child.tagName.toLowerCase())) {
                return this.convertParty(child.dataset, child.textContent);
            }
            return null;
        }).filter(party => party !== null);
        if (attribution.length > 0) {
            this.#attribution = attribution;
        }

        this.render();
    }

    private convertParty(data: DOMStringMap, textContent: string): SeatDataWithNumber|null {
        const color = data["color"];
        if (!color) {
            return null;
        }
        const borderSizeStr = data["borderSize"];
        const nSeatsStr = data["nSeats"] ?? textContent;
        return {
            color,
            id: data["id"],
            data: data["data"],
            borderSize: borderSizeStr ? +borderSizeStr : undefined,
            borderColor: data["borderColor"],
            nSeats: nSeatsStr ? +nSeatsStr : undefined,
        };
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
customElements.define("parliament-arch", ParliamentArch);
