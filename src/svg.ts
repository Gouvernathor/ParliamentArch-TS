import { dispatchSeats as genericDispatchSeats, regroupSeatCenters } from "@parliamentarch/core/utils";
import { getGroupedSVG, GetGroupedSVGOptions, SeatData } from "@parliamentarch/svg";
export {
    ClassSeatData,
    StandaloneSeatData,
    SeatData,
    GetGroupedSVGOptions,
    getGroupedSVG
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

export function getSVG(
    seatCenters: Iterable<readonly [readonly [number, number], SeatData]>,
    seatActualRadius: number,
    options: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    const seatCentersByGroup = regroupSeatCenters(seatCenters);
    return getGroupedSVG(seatCentersByGroup, seatActualRadius, options);
}
