export interface SeatData {
    readonly color: string;
    readonly id?: string;
    readonly data?: string;
    readonly borderSize?: number;
    readonly borderColor?: string;
}
export interface SeatDataWithNumber extends SeatData {
    nSeats?: number;
}

/**
 * Typically S is a tuple of x/y coordinates.
 * Typically the groups are ordered from the left to the right, and the seats are ordered from left to right.
 * If too few or too many seats are provided, an error is thrown.
 * @param groupSeats a mapping of groups associating the groups in a given order to the number of seats each group holds
 * @param seats an iterable of seats in a given order, its length should be the sum of the values in groupSeats
 * @returns a mapping of each group to the seats it holds
 */
export function dispatchSeats<S>(
    groupSeats: Map<SeatData, number> | SeatDataWithNumber[],
    seats: Iterable<S>,
): Map<SeatData, S[]> {
    const seatIterator = seats[Symbol.iterator]();
    const entries: [SeatData, number][] = groupSeats instanceof Map ?
        Array.from(groupSeats) :
        groupSeats.map(seatData => [seatData, seatData.nSeats ?? 1]);

    try {
        return new Map(entries.map(([group, nSeats]) =>
            [group, Array.from({ length: nSeats }, () => {
                const seatIteration = seatIterator.next();
                if (seatIteration.done) {
                    throw new Error("Not enough seats");
                }
                return seatIteration.value;
            })]
        ));
    } finally {
        if (!seatIterator.next().done) {
            throw new Error("Too many seats");
        }
    }
}

export function getSVG(
    seatCenters: Iterable<[SeatData, [number, number][]]>,
    seatActualRadius: number,
    options: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    const seatCentersByGroup = new Map();
    for (const [seat, group] of seatCenters) {
        if (!seatCentersByGroup.has(group)) {
            seatCentersByGroup.set(group, []);
        }
        seatCentersByGroup.get(group)!.push(seat);
    }
    return getGroupedSVG(seatCentersByGroup, seatActualRadius, options);
}

const SVG_NS = "http://www.w3.org/2000/svg";

export interface GetGroupedSVGOptions {
    canvasSize: number;
    margins: number | [number, number] | [number, number, number, number];
    writeNumberOfSeats: boolean;
    fontSizeFactor: number;
}

export function getGroupedSVG(
    seatCentersByGroup: Iterable<[SeatData, [number, number][]]>,
    seatActualRadius: number,
    {
        canvasSize = 175,
        margins = 5,
        writeNumberOfSeats = true,
        fontSizeFactor = 36 / 175,
    }: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    if (!Array.isArray(margins)) {
        margins = [margins, margins, margins, margins];
    } else if (margins.length === 2) {
        margins = [margins[0], margins[1], margins[0], margins[1]];
    }
    const [leftMargin, topMargin, rightMargin, bottomMargin] = margins;

    const svg = document.createElementNS(SVG_NS, "svg");

    populateHeader(svg,
        leftMargin + 2 * canvasSize + rightMargin,
        topMargin + canvasSize + bottomMargin,
    );
    if (writeNumberOfSeats) {
        addNumberOfSeats(svg,
            Array.from(seatCentersByGroup, group => group[1].length).reduce((a, b) => a + b, 0),
            leftMargin + canvasSize,
            topMargin + (canvasSize * 170 / 175),
            Math.round(fontSizeFactor * canvasSize),
        );
    }
    addGroupedSeats(svg,
        seatCentersByGroup,
        seatActualRadius,
        canvasSize,
        leftMargin,
        topMargin,
    );
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
}

function addNumberOfSeats(
    svg: SVGSVGElement,
    nSeats: number,
    x: number,
    y: number,
    fontSize: number,
): void {
    const text = svg.appendChild(document.createElementNS(SVG_NS, "text"));
    text.setAttribute("x", x.toString());
    text.setAttribute("y", y.toString());
    text.setAttribute("style", `font-size: ${fontSize}px; font-weight: bold; text-align: center; text-anchor: middle; font-family: sans-serif;`);
    text.textContent = nSeats.toString();
}

function addGroupedSeats(
    svg: SVGSVGElement,
    seatCentersByGroup: Iterable<[SeatData, [number, number][]]>,
    seatActualRadius: number,
    canvasSize: number,
    leftMargin: number,
    topMargin: number,
): void {
    let groupNumberFallback = 0;

    for (const [group, seatCenters] of seatCentersByGroup) {
        const groupBorderWidth = (group.borderSize ?? 0) * seatActualRadius * canvasSize;

        const groupG = svg.appendChild(document.createElementNS(SVG_NS, "g"));

        let gStyle = `fill: ${group.color};`;
        if (groupBorderWidth > 0) {
            gStyle += ` stroke: ${group.borderColor ?? "black"}; stroke-width: ${groupBorderWidth};`;
        }
        groupG.setAttribute("style", gStyle);

        groupG.setAttribute("id", group.id ?? `group-${groupNumberFallback++}`);

        if (group.data) {
            groupG.appendChild(document.createElementNS(SVG_NS, "title")).textContent = group.data;
        }

        for (const [x, y] of seatCenters) {
            const circle = groupG.appendChild(document.createElementNS(SVG_NS, "circle"));
            circle.setAttribute("cx", (leftMargin + canvasSize * x).toString());
            circle.setAttribute("cy", (topMargin + canvasSize * (1 - y)).toString());
            circle.setAttribute("r", (seatActualRadius * canvasSize - groupBorderWidth / 2).toString());
        }
    }
}
