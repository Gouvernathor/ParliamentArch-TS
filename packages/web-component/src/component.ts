import { FillingStrategy } from "@parliamentarch/core/geometry";
import { getSVGFromAttribution, GetSVGFromAttributionOptions } from "@parliamentarch/svg";

type Attribution = Parameters<typeof getSVGFromAttribution>[0];
type SeatDataWithNumber = Exclude<Attribution, ReadonlyMap<any, any>>[number];

export class ParliamentArch extends HTMLElement {
    // The options
    static observedAttributes = [
        // required
        "data-seat-radius-factor", // number

        // geometry options
        "data-min-n-rows", // number
        "data-filling-strategy",
        "data-span-angle", // number

        // proper options
        "data-seat-number-font-size-factor", // number
    ];

    #shadow;
    #attribution;
    #options;
    #observer;

    constructor(
        attribution: Attribution,
        options: Partial<GetSVGFromAttributionOptions> = {},
    ) {
        super();
        this.#shadow = this.attachShadow({ mode: "open" });
        this.#attribution = attribution;
        this.#options = options;

        // setup mutation observer to watch child content changes
        this.#observer = new MutationObserver(() => this.updateAttribution());
    }

    /**
     * This method resets and overrides both the attribution and the options.
     * If the DOM is updated, either through the attributes or the children,
     * the changes will override the values set through this method.
     *
     * The changes will not take effect until the next call to `render()`.
     */
    setAttributionAndOptions(
        attribution: Attribution,
        options: Partial<GetSVGFromAttributionOptions> = {},
    ) {
        this.#attribution = attribution;
        this.#options = options;
    }

    /**
     * This method renders the SVG in the shadow DOM.
     * It should only be called when the component is connected to the DOM.
     */
    render() {
        this.#shadow.replaceChildren();
        let svgElement;
        try {
            svgElement = this.makeSVGElement();
        } catch (error) {
            console.error("Error rendering SVG:", error);
        }
        if (svgElement) {
            this.#shadow.appendChild(svgElement);
        }
    }


    // Web Component methods

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
        this.#options = {};

        for (const numberOption of ["seatRadiusFactor", "minNRows", "spanAngle", "seatNumberFontSizeFactor"] as const) {
            if (numberOption in data) {
                const value = +(data[numberOption]!);
                if (!Number.isNaN(value)) {
                    this.#options[numberOption] = value;
                }
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
    }

    private updateAttribution() {
        // Extract attribution data from child elements
        const attribution = Array.from(this.children, child => {
            if (child instanceof HTMLElement && "seat-group" === child.tagName.toLowerCase()) {
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
        const nSeats = +(data["nSeats"] ?? textContent);
        if (!Number.isInteger(nSeats) || nSeats <= 0) {
            return null;
        }
        return {
            color,
            data: data["data"],
            borderSize: borderSizeStr ? +borderSizeStr : undefined,
            borderColor: data["borderColor"],
            nSeats,
        };
    }

    private makeSVGElement(): SVGSVGElement {
        return getSVGFromAttribution(this.#attribution, this.#options);
    }
}

customElements.define("parliament-arch", ParliamentArch);
