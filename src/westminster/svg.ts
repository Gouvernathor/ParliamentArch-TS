import { Area, AREAS, newRecord, Poseidon } from "./common.js";

/**
 * Makes the document constant available, whether in a browser or in Node.js,
 * without ever importing it in browser mode.
 */
const doc = globalThis.document ??
    (new (await import("jsdom")).JSDOM()).window.document;

const SVG_NS = "http://www.w3.org/2000/svg";

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
     * This is to be multiplied by the side of a square
     * to get the actual spacing between two neighboring squares.
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

    const [maxX, maxY] = addGroupedSeats(svg, poseidon, { roundingRadius, spacingFactor });

    populateHeader(svg, [maxX, maxY]);

    return svg;
}

function populateHeader(
    svg: SVGSVGElement,
    [viewBoxWidth, viewBoxHeight]: [number, number],
): void {
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("version", "1.1");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);

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
): [number, number] {
    const extremums = newRecord(AREAS, () => ({ x: extremum(), y: extremum() }));

    const areaContainers = newRecord(AREAS, (area) => {
        const areaContainer = createArea(poseidon[area], extremums[area], options);
        areaContainer.setAttribute("id", `area-${area}`);
        return container.appendChild(areaContainer);
    });

    // start with the opposition, which will give us the bottom opposition y coordinate
    const oppositionXOffset = 1; // because of the speaker
    const oppositionYOffset = 0;
    areaContainers.opposition.setAttribute("transform", `translate(${oppositionXOffset}, ${oppositionYOffset})`);

    // then the government using that bottom, which will give us the bottom y coordinate
    const governmentXOffset = 1; // because of the speaker
    const governmentYOffset = 2 + (extremums.opposition.y.max ?? 0); // TODO not true if both wings have equal rows and opposition is empty
    areaContainers.government.setAttribute("transform", `translate(${governmentXOffset}, ${governmentYOffset})`);

    const maxWingsX = Math.max(extremums.opposition.x.max ?? 0, extremums.government.x.max ?? 0);
    const maxY = governmentYOffset + (extremums.government.y.max ?? extremums.opposition.y.max ?? 0);

    // then the speaker from the bottom y coordinate
    const speakerXOffset = 0;
    const speakerYOffset = (maxY - (extremums.speak.y.max ?? 0)) / 2;
    areaContainers.speak.setAttribute("transform", `translate(${speakerXOffset}, ${speakerYOffset})`);

    // then the crossbenchers from the bottom y coordinate and the right x coordinate of the wings
    // we have the right x coordinate of the wings from the max x of both wings
    const crossXOffset = 1/*speaker*/ + maxWingsX + 1/*gap*/;
    const crossYOffset = speakerYOffset - (extremums.cross.y.max ?? 0) / 2;
    areaContainers.cross.setAttribute("transform", `translate(${crossXOffset}, ${crossYOffset})`);

    return [
        crossXOffset + (extremums.cross.x.max ?? -1) + 1,
        maxY + 1,
    ];
}

function createArea(
    a: Poseidon<Party>[Area],
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

        for (const [x, y] of seats) {
            ex.x(x);
            ex.y(y);
            partyGroup.appendChild(rectWithCoordinates(x, y, partyOptions));
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
    rect.setAttribute("x", (spacingFactor/2 + x).toString());
    rect.setAttribute("y", (spacingFactor/2 + y).toString());
    rect.setAttribute("width", (1 - spacingFactor).toString());
    rect.setAttribute("height", (1 - spacingFactor).toString());
    rect.setAttribute("rx", roundingRadius.toString());
    rect.setAttribute("ry", roundingRadius.toString());
    return rect;
}
