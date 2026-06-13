import "./document-loader.js";
import { MajorityLineCheckpoints } from "@parliamentarch/core/majority-line";

const isReadonlyArray: (arg: any) => arg is readonly any[] = Array.isArray;
const convertToArray: <T>(i: Iterable<T>) => readonly T[] = i => isReadonlyArray(i) ?
    i :
    [...i];

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

export interface MajorityLineDisplayData {
    readonly class?: string|readonly string[];
    readonly id?: string;
    readonly data?: string;
    readonly color?: string;
    readonly width?: number;
    readonly dasharray?: number[];
}

export interface MajorityLineData extends MajorityLineDisplayData, MajorityLineCheckpoints {}

const SVG_NS = "http://www.w3.org/2000/svg";

export interface GetGroupedSVGOptions {
    /**
     * The seat number will only be displayed for values superior to 0.
     */
    seatNumberFontSizeFactor: number;
    majorityLineCheckpoints: readonly MajorityLineData[];
}

const ARCH_RADIUS = 175;

export function getGroupedSVG(
    seatCentersByGroup: Iterable<readonly [SeatData, readonly (readonly [number, number])[]]>,
    seatActualRadius: number,
    {
        seatNumberFontSizeFactor = 1,
        majorityLineCheckpoints,
    }: Partial<Readonly<GetGroupedSVGOptions>> = {},
): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg");

    const numberOfSeats = seatNumberFontSizeFactor > 0 ?
        getNumberOfSeats(
            // needs to happen before the call to getGroupedSeats
            (seatCentersByGroup = convertToArray(seatCentersByGroup)).reduce((a, b) => a + b[1].length, 0),
            seatNumberFontSizeFactor * 36 * ARCH_RADIUS / 175,
        ) :
        null;

    populateHeader(svg);

    addGroupedSeats(svg,
        seatCentersByGroup,
        seatActualRadius,
    );

    if (majorityLineCheckpoints) {
        for (const c of majorityLineCheckpoints) {
            addMajorityLine(svg, c);
        }
    }

    if (numberOfSeats) {
        svg.appendChild(numberOfSeats);
    }
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

const SEATS_Y = `${170/175 * 100}%`;

function getNumberOfSeats(
    nSeats: number,
    fontSize: number,
): SVGElement {
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "50%");
    text.setAttribute("y", SEATS_Y);
    text.setAttribute("style", `font-size: ${fontSize/16}rem; font-weight: bold; text-align: center; text-anchor: middle; font-family: sans-serif;`);
    text.textContent = nSeats.toString();
    return text;
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
                circle.classList = isReadonlyArray(group.class) ?
                    group.class.join(" ") :
                    group.class;
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

function addMajorityLine(
    svg: SVGSVGElement,
    c: MajorityLineData,
): void {
    const path = svg.appendChild(document.createElementNS(SVG_NS, "path"));

    path.setAttribute("d", getD(pointScaler(c.startPoint), c.checkpoints.map(pointScaler), pointScaler(c.endPoint), c.rowThickness * ARCH_RADIUS * .5));

    path.setAttribute("fill", "none");
    path.setAttribute("stroke", c.color ?? "black");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-width", `${c.rowThickness/10 *(c.width ?? 1) *ARCH_RADIUS}`);
    if (c.dasharray) {
        path.setAttribute("stroke-dasharray", c.dasharray.toString());
    }

    if (c.id) {
        path.setAttribute("id", c.id);
    }
    if (c.class) {
        path.classList = isReadonlyArray(c.class) ?
            c.class.join(" ") :
            c.class;
    }
    if (c.data) {
        path.appendChild(document.createElementNS(SVG_NS, "title")).textContent = c.data;
    }
}

type Point = readonly [number, number];

function pointScaler([x, y]: Point): Point {
    return [ARCH_RADIUS*x, ARCH_RADIUS * (1-y)];
}

function getD(startPoint: Point, checkpoints: readonly Point[], endPoint: Point, cpOffset: number): string {
    // absolute cubic curve
    /*
    so, we need to start (M) from the startPoint
    then do an S, so a sequence of control point then point
    for each checkpoint, the control point is the same but offset by a factor times the rowThicc (or maxSeatRadius)
    then one additional where both the control point and the point are the endPoint
    */

    return `M ${startPoint} S ${checkpoints.map(point => [offsetToCenter(point, cpOffset), point])} ${[endPoint, endPoint]}`;
}

const CENTER = pointScaler([1, 0]);
function offsetToCenter(point: Point, distance: number): Point {
    // base point + normalize(vector from base point to center)*distance
    const [x, y] = point;
    const [offsetX, offsetY] = normalize([CENTER[0]-x, CENTER[1]-y], distance);
    return [x+offsetX, y+offsetY];
}

function normalize([x, y]: Point, newNorm = 1): Point {
    const norm = Math.sqrt(x**2 + y**2);
    return [x/norm * newNorm, y/norm * newNorm];
}
