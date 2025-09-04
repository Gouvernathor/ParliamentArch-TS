/**
 * Makes the document constant available, whether in a browser or in Node.js,
 * without ever importing it in browser mode.
 */
const doc = globalThis.document ??
    (await import("jsdom")
        .then(m => new m.JSDOM())
    ).window.document;

const SVG_NS = "http://www.w3.org/2000/svg";

export {};
