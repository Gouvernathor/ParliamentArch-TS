import "./document-loader.js";

export interface ClassSeatData {
    /**
     * CSS class or classes to apply to this group of seats.
     */
    readonly class?: string|readonly string[];
}

export interface StandaloneSeatData {
    /**
     * The id of this group of seats.
     */
    readonly id?: string|undefined;
    /**
     * Some human-readable data about this group of seats.
     */
    readonly data?: string|undefined;
    /**
     * Sets the fill color of the seats in this group.
     * In CSS class mode, you can replace this with the "fill" property.
     */
    readonly color: string;
    /**
     * Sets the border size of the seats in this group, as a factor of the seat radius.
     * In CSS class mode, you can replace this with the "stroke-width" property.
     */
    readonly borderSize?: number|undefined;
    /**
     * Sets the color of the border of the seats in this group.
     * In CSS class mode, you can replace this with the "stroke" property.
     */
    readonly borderColor?: string|undefined;
}

export type SeatData = ClassSeatData | StandaloneSeatData;

const SVG_NS = "http://www.w3.org/2000/svg";

export interface GetGroupedSVGOptions {
    /**
     * The seat number will only be displayed for values superior to 0.
     */
    seatNumberFontSizeFactor: number;
}

const ARCH_RADIUS = 175;

export function getGroupedSVG(
    seatCentersByGroup: Iterable<readonly [SeatData, readonly (readonly [number, number])[]]>,
    seatActualRadius: number,
    {
        seatNumberFontSizeFactor = 1,
    }: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg");

    populateHeader(svg);
    if (seatNumberFontSizeFactor > 0) {
        addNumberOfSeats(svg,
            Array.from(seatCentersByGroup, group => group[1].length).reduce((a, b) => a + b, 0),
            seatNumberFontSizeFactor * 36 * ARCH_RADIUS / 175,
        );
    }
    addGroupedSeats(svg,
        seatCentersByGroup,
        seatActualRadius,
    );
    return svg;
}

function populateHeader(
    svg: SVGSVGElement,
): void {
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("version", "1.1");
    svg.setAttribute("viewBox", `0 0 ${2*ARCH_RADIUS} ${ARCH_RADIUS}`);

    svg.appendChild(document.createComment("Created with parliamentarch (https://github.com/Gouvernathor/ParliamentArch-TS)"));
}

function addNumberOfSeats(
    svg: SVGSVGElement,
    nSeats: number,
    fontSize: number,
): void {
    const text = svg.appendChild(document.createElementNS(SVG_NS, "text"));
    text.setAttribute("x", `50%`);
    text.setAttribute("y", `${170/175 *100}%`);
    text.setAttribute("style", `font-size: ${fontSize/16}rem; font-weight: bold; text-align: center; text-anchor: middle; font-family: sans-serif;`);
    text.textContent = nSeats.toString();
}

function addGroupedSeats(
    svg: SVGSVGElement,
    seatCentersByGroup: Iterable<readonly [SeatData, readonly (readonly [number, number])[]]>,
    seatActualRadius: number,
): void {
    let groupNumberFallback = 0;

    for (const [group, seatCenters] of seatCentersByGroup) {
        const groupBorderWidth = ("borderSize" in group && group.borderSize ?
            group.borderSize * seatActualRadius * ARCH_RADIUS :
            0);

        const seatsContainer = "color" in group || "borderSize" in group || "borderColor" in group ?
            addGroupG(svg, group as StandaloneSeatData, groupBorderWidth, groupNumberFallback++) :
            svg;

        for (const [x, y] of seatCenters) {
            const circle = seatsContainer.appendChild(document.createElementNS(SVG_NS, "circle"));
            if ("class" in group && group.class) {
                circle.classList = Array.isArray(group.class) ?
                    group.class.join(" ") :
                    group.class as string;
            }
            circle.setAttribute("cx", (ARCH_RADIUS * x).toString());
            circle.setAttribute("cy", (ARCH_RADIUS * (1 - y)).toString());
            circle.setAttribute("r", (seatActualRadius * ARCH_RADIUS - groupBorderWidth / 2).toString());
        }
    }
}

function addGroupG(
    svg: SVGSVGElement,
    group: StandaloneSeatData,
    groupBorderWidth: number,
    groupNumber: number,
): SVGGElement {
    const groupG = svg.appendChild(document.createElementNS(SVG_NS, "g"));

    const gStyle = [];
    if (group.color) {
        gStyle.push(`fill: ${group.color};`);
    }
    if (groupBorderWidth > 0) {
        gStyle.push(`stroke: ${group.borderColor ?? "black"}; stroke-width: ${groupBorderWidth};`);
    }
    groupG.setAttribute("style", gStyle.join(" "));

    groupG.setAttribute("id", group.id ?? `group-${groupNumber}`);

    if (group.data) {
        groupG.appendChild(document.createElementNS(SVG_NS, "title")).textContent = group.data;
    }

    return groupG;
}
