/**
 * Makes the document constant available, whether in a browser or in Node.js,
 * without ever importing it in browser mode.
 */
if (!globalThis.document) {
    const m = "jsdom";
    await import(/* @vite-ignore */m)
        .then(m => globalThis.document = new m.JSDOM().window.document)
        .catch(() =>
            console.error("Failed to load jsdom or the document constant at ParliamentArch load time : you need to set globalThis.document before generating SVGs in Node.js"));
}

export {};
