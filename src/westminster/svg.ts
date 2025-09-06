import { Area, Poseidon } from "./common";

/**
 * Makes the document constant available, whether in a browser or in Node.js,
 * without ever importing it in browser mode.
 */
const doc = globalThis.document ??
    (new (await import("jsdom")).JSDOM()).window.document;

const SVG_NS = "http://www.w3.org/2000/svg";

export {};


export interface Party {
    color: string;
    id?: string|undefined;
    data?: string|undefined;

    borderSize?: number|undefined;
    borderColor?: string|undefined;
    roundingRadius?: number|undefined;
}

export interface Options {
    /**
     * The default value for the rounding radius of the corners of the squares,
     * unless overridden for a specific party.
     */
    roundingRadius: number; // default 0

    /**
     * The relative spacing between neighboring squares of the same area.
     * This is to be multiplied by the side of a square to get the actual spacing.
     */
    spacingFactor: number; // default .1
}
function defaultOptions({
    roundingRadius = 0,
    spacingFactor = 0.1,
}: Partial<Options> = {}): Options {
    return {
        roundingRadius,
        spacingFactor,
    };
}


export function buildSVG(
    poseidon: Poseidon<Party>,
    options: Partial<Options> = {},
): SVGSVGElement {
    const { roundingRadius, spacingFactor } = defaultOptions(options);

    const svg = doc.createElementNS(SVG_NS, "svg");

    populateHeader(svg);

    // TODO have the addGroupedSeats return the extremum coordinates,
    // and use them to compute the width and height of the SVG after populating it ?

    addGroupedSeats(svg, poseidon, { roundingRadius, spacingFactor });

    return svg;
}

function populateHeader(svg: SVGSVGElement): void {
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("version", "1.1");
    // width
    // height
    /* TODO
    the width is the maximum x coordinate of any square, plus 1 (square side)
    the height is the maximum y coordinate of any square, plus 1 (square side),
    plus the minimum y coordinate of any square.
    */

    svg.appendChild(doc.createComment("Created with ParliamentArch (https://github.com/Gouvernathor/ParliamentArch-TS)"));
}

function addGroupedSeats(
    svg: SVGSVGElement,
    poseidon: Poseidon<Party>,
    options: Pick<Options, "roundingRadius"|"spacingFactor">,
): void {
    // TODO
}
