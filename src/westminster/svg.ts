import { Area } from "./common";

/**
 * Makes the document constant available, whether in a browser or in Node.js,
 * without ever importing it in browser mode.
 */
const doc = globalThis.document ??
    (await import("jsdom")
        .then(m => new m.JSDOM())
    ).window.document;

const SVG_NS = "http://www.w3.org/2000/svg";

export interface SeatData {
    color: string;
    group: Area;
    id?: string|undefined;
    data?: string|undefined;
}
export interface SeatDataWithNumber extends SeatData {
    nSeats: number;
}

export function buildSVG(
    parties: Iterable<SeatDataWithNumber>,
    poslist: Iterable<[Area, [number, number][]]>,
    blockside: number,
    wingRows: unknown,
    fullwidthOrCozy: boolean,
    roundingRadius: number,
    svgwidth: number,
    svgheight: number,
): SVGSVGElement {
    const svg = doc.createElementNS(SVG_NS, "svg");

    populateHeader(svg, svgwidth, svgheight);

    const diagramGroup = svg.appendChild(doc.createElementNS(SVG_NS, "g"));
    diagramGroup.setAttribute("id", "diagram");

    addGroupedSeats(diagramGroup,
        parties, poslist,
        blockside, roundingRadius,
        fullwidthOrCozy);
    return svg;
}

function populateHeader(
    svg: SVGSVGElement,
    width: number,
    height: number,
): void {
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("version", "1.1");
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());

    svg.appendChild(doc.createComment("Created with parliamentarch (https://github.com/Gouvernathor/ParliamentArch-TS)"));
}

function addGroupedSeats(
    base: SVGElement,
    parties: Iterable<SeatDataWithNumber>,
    poslist: Iterable<[Area, [number, number][]]>,
    blockside: number,
    roundingRadius: number,
    fullwidthOrCozy: boolean,
): void {
    let groupNumberFallback = 0;

    for (const [area, positions] of poslist) {
        const iterPositions = positions[Symbol.iterator]();
        const areaGroup = base.appendChild(doc.createElementNS(SVG_NS, "g"));
        areaGroup.setAttribute("id", `${area}-benches`);
        for (const party of parties) {
            if (party.group === area) {
                const partyGroup = areaGroup.appendChild(doc.createElementNS(SVG_NS, "g"));

                partyGroup.setAttribute("id", party.id ?? `group-${groupNumberFallback++}`);
                if (party.data) {
                    partyGroup.appendChild(doc.createElementNS(SVG_NS, "title")).textContent = party.data;
                }

                partyGroup.setAttribute("style", `fill: ${party.color};`);

                for (let i = 0; i < party.nSeats; i++) {
                    const { value: position } = iterPositions.next() as IteratorResult<[number, number]>;
                    const seat = partyGroup.appendChild(doc.createElementNS(SVG_NS, "rect"));
                    seat.setAttribute("x", position[0].toString());
                    seat.setAttribute("y", position[1].toString());
                    seat.setAttribute("rx", roundingRadius.toString());
                    seat.setAttribute("ry", roundingRadius.toString());
                    seat.setAttribute("width", blockside.toString());
                    seat.setAttribute("height", blockside.toString());
                }

                if (!fullwidthOrCozy) {
                    // TODO skip some positions
                }
            }
        }
    }
}
