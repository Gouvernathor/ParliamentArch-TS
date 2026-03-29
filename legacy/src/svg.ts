import { dispatchSeats as genericDispatchSeats, regroupSeatCenters } from "@parliamentarch/core/utils";
import { getGroupedSVG as newGetGroupedSVG, GetGroupedSVGOptions as NewGetGroupedSVGOptions, SeatData } from "@parliamentarch/svg";
export {
    ClassSeatData,
    StandaloneSeatData,
    SeatData,
} from "@parliamentarch/svg";

export type SeatDataWithNumber = SeatData & {
    readonly nSeats?: number|undefined;
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
    groupSeats: Map<SeatData, number> | readonly SeatDataWithNumber[],
    seats: Iterable<S>,
): Map<SeatData, S[]> {
    return genericDispatchSeats(groupSeats, seats);
}

export interface GetGroupedSVGOptions {
    canvasSize: number;
    margins: number | readonly [number, number] | readonly [number, number, number, number];
    writeNumberOfSeats: boolean;
    fontSizeFactor: number;
}

export function getSVG(
    seatCenters: Iterable<readonly [readonly [number, number], SeatData]>,
    seatActualRadius: number,
    options: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    const seatCentersByGroup = regroupSeatCenters(seatCenters);
    return getGroupedSVG(seatCentersByGroup, seatActualRadius, options);
}

const isArray: (a: any) => a is readonly any[] = Array.isArray;

function legacySizeHandling(
    svg: SVGSVGElement,
    {
        canvasSize = 175,
        margins = 5,
    }: Partial<Pick<GetGroupedSVGOptions, "canvasSize"|"margins">>,
): SVGSVGElement {
    if (!isArray(margins)) {
        margins = [margins, margins, margins, margins];
    } else if (margins.length === 2) {
        margins = [margins[0], margins[1], margins[0], margins[1]];
    }
    const [leftMargin, topMargin, rightMargin, bottomMargin] = margins;

    const width = leftMargin + 2 * canvasSize + rightMargin;
    const height = topMargin + canvasSize + bottomMargin;

    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.style.marginLeft = `${leftMargin}px`;
    svg.style.marginRight = `${rightMargin}px`;
    svg.style.marginTop = `${topMargin}px`;
    svg.style.marginBottom = `${bottomMargin}px`;

    return svg;
}

export function getGroupedSVG(
    groupedSeatCenters: ReturnType<typeof regroupSeatCenters<SeatData>>,
    seatActualRadius: number,
    options: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    const newOptions: Partial<NewGetGroupedSVGOptions> = {};
    if (options.writeNumberOfSeats === false) {
        newOptions.seatNumberFontSizeFactor = 0;
    } else if ("fontSizeFactor" in options) {
        newOptions.seatNumberFontSizeFactor = options.fontSizeFactor * 175/36;
    }
    return legacySizeHandling(newGetGroupedSVG(groupedSeatCenters, seatActualRadius, newOptions), options);
}
