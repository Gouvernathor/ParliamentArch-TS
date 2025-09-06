import { Area, AREAS, newRecord, Poseidon } from "./common";

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
    // width from input
    // height from input
    /* TODO
    add a viewBox
    the width is the maximum x coordinate of any square, plus 1 (square side)
    the height is the maximum y coordinate of any square, plus 1 (square side),
    plus the minimum y coordinate of any square.
    */

    svg.appendChild(doc.createComment("Created with ParliamentArch (https://github.com/Gouvernathor/ParliamentArch-TS)"));
}

function extremum() {
    const f = (v: number) => {
        if (f.min === null || v < f.min) f.min = v;
        if (f.max === null || v > f.max) f.max = v;
    };
    f.min = null as number|null;
    f.max = null as number|null;
    return f;
}

function addGroupedSeats(
    container: SVGElement,
    poseidon: Poseidon<Party>,
    options: Pick<Options, "roundingRadius"|"spacingFactor">,
): void {
    const extremums = newRecord(AREAS, () => ({ x: extremum(), y: extremum() }));

    // start with the opposition, which will give us the bottom opposition y coordinate
    const oppositionXOffset = 1; // because of the speaker
    const oppositionYOffset = 0;
    container.appendChild(createArea(
        poseidon.opposition,
        oppositionXOffset, oppositionYOffset,
        extremums.opposition,
        options,
    ));

    // then the government using that bottom, which will give us the bottom y coordinate
    const governmentXOffset = 1; // because of the speaker
    const governmentYOffset = 2 + (extremums.opposition.y.max ?? 0); // TODO not true if both wings have equal rows and opposition is empty
    container.appendChild(createArea(
        poseidon.government,
        governmentXOffset, governmentYOffset,
        extremums.government,
        options,
    ));

    // then the speaker from the bottom y coordinate
    const speakerXOffset = 0;
    const speakerYOffset = extremums.government.y.max ?? (extremums.opposition.y.max! + 2); // FIXME incorrect
    container.appendChild(createArea(
        poseidon.speak,
        speakerXOffset, speakerYOffset,
        extremums.speak,
        options,
    ));

    // then the crossbenchers from the bottom y coordinate and the right x coordinate of the wings
    // we have the right x coordinate of the wings from the max x of both wings
    const crossXOffset = 1/*speaker*/ + Math.max(extremums.opposition.x.max ?? 0, extremums.government.x.max ?? 0) + 1/*gap*/;
    const crossYOffset = speakerYOffset;
    container.appendChild(createArea(
        poseidon.cross,
        crossXOffset, crossYOffset,
        extremums.cross,
        options,
    ));
}

function createArea(
    a: Poseidon<Party>[Area],
    xOffset: number, yOffset: number,
    ex: { x: ReturnType<typeof extremum>, y: ReturnType<typeof extremum> },
    { roundingRadius, spacingFactor }: Pick<Options, "roundingRadius"|"spacingFactor">,
): SVGGElement {
    const areaGroup = doc.createElementNS(SVG_NS, "g");
    for (const [party, seats] of a) {
        const partyGroup = areaGroup.appendChild(doc.createElementNS(SVG_NS, "g"));
        populatePartyGroup(partyGroup, party);
        const partyOptions = {
            roundingRadius: party.roundingRadius ?? roundingRadius,
            spacingFactor,
        };

        for (const [col, row] of seats) {
            const x = xOffset + col;
            const y = yOffset + row;
            ex.x(x);
            ex.y(y);
            partyGroup.appendChild(rectWithCoordinates(y, x, partyOptions));
        }
    }
    return areaGroup;
}

function populatePartyGroup(
    partyGroup: SVGGElement,
    party: Party,
): void {
    if (party.id !== undefined) {
        partyGroup.setAttribute("id", party.id);
    }
    if (party.data !== undefined) {
        partyGroup.appendChild(doc.createElementNS(SVG_NS, "title"))
            .textContent = party.data;
    }

    partyGroup.setAttribute("fill", party.color);
    if (party.borderSize !== undefined) {
        partyGroup.setAttribute("stroke-width", party.borderSize.toString());
        partyGroup.setAttribute("stroke", party.borderColor ?? "black");
    }
}

function rectWithCoordinates(
    x: number, y: number,
    { roundingRadius, spacingFactor }: Pick<Options, "roundingRadius"|"spacingFactor">,
): SVGRectElement {
    const rect = doc.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", (spacingFactor + x).toString());
    rect.setAttribute("y", (spacingFactor + y).toString());
    rect.setAttribute("width", (1 - 2*spacingFactor).toString());
    rect.setAttribute("height", (1 - 2*spacingFactor).toString());
    rect.setAttribute("rx", roundingRadius.toString());
    rect.setAttribute("ry", roundingRadius.toString());
    return rect;
}
