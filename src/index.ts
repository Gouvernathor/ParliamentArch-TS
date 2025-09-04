import { getNRowsFromNSeats, getRowThickness, getSeatsCenters, type GetSeatsCentersOptions } from "./geometry.js";
import { dispatchSeats, getGroupedSVG, type GetGroupedSVGOptions, type SeatData, type SeatDataWithNumber } from "./svg.js";

export { type SeatData, type SeatDataWithNumber } from "./svg.js";

interface GetSVGFromAttributionOptions extends GetSeatsCentersOptions, GetGroupedSVGOptions {
    seatRadiusFactor: number;
}

/**
 * This is the preferred overload.
 */
export function getSVGFromAttribution(
    attribution: Map<SeatData, number> | readonly SeatDataWithNumber[],
    options?: Partial<GetSVGFromAttributionOptions>,
): SVGSVGElement;
/**
 * This version is deprecated. Please use the overload with the single options object instead.
 */
export function getSVGFromAttribution(
    attribution: Map<SeatData, number> | readonly SeatDataWithNumber[],
    seatRadiusFactor?: number,
    getSeatsCentersOptions?: Partial<GetSeatsCentersOptions>,
    getGroupedSVGOptions?: Partial<GetGroupedSVGOptions>,
): SVGSVGElement;
export function getSVGFromAttribution(
    attribution: Map<SeatData, number> | readonly SeatDataWithNumber[],
    options: number|Partial<GetSVGFromAttributionOptions> = {},
    getSeatsCentersOptions: Partial<GetSeatsCentersOptions> = {},
    getGroupedSVGOptions: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    if (!(attribution instanceof Map)) {
        attribution = new Map(attribution.map(seatData => [seatData, seatData.nSeats ?? 1]));
    }

    if (typeof options === "number") {
        options = { seatRadiusFactor: options, ...getSeatsCentersOptions, ...getGroupedSVGOptions };
    }
    options.seatRadiusFactor ??= .8;

    const nSeats = [...attribution.values()].reduce((a, b) => a + b, 0);

    const results = getSeatsCenters(nSeats, options);
    const seatCentersByGroup = dispatchSeats(attribution, [...results.keys()].sort((a, b) => results.get(b)! - results.get(a)!));
    const seatActualRadius = options.seatRadiusFactor * getRowThickness(getNRowsFromNSeats(nSeats));
    return getGroupedSVG(seatCentersByGroup, seatActualRadius, options);
}
