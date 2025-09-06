/**
 * Makes the document constant available, whether in a browser or in Node.js,
 * without ever importing it in browser mode.
 */
const doc = globalThis.document ??
    (new (await import("jsdom")).JSDOM()).window.document;

const SVG_NS = "http://www.w3.org/2000/svg";

export {};


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
