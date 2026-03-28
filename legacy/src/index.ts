import { type GetSeatCentersOptions as GetSeatsCentersOptions } from "@parliamentarch/core/geometry";
import { precomputeFromAttribution, PrecomputeOptions } from "@parliamentarch/core/utils";
import { type SeatData } from "@parliamentarch/svg";
import { getGroupedSVG, GetGroupedSVGOptions, type SeatDataWithNumber } from "./svg.js";

export { type SeatData, type SeatDataWithNumber } from "./svg.js";

interface GetSVGFromAttributionOptions extends PrecomputeOptions, GetGroupedSVGOptions {
}

/**
 * This is the preferred overload.
 */
export function getSVGFromAttribution(
    attribution: Map<SeatData, number> | readonly SeatDataWithNumber[],
    options?: Partial<GetSVGFromAttributionOptions>,
): SVGSVGElement;
/**
 * @deprecated
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
    if (typeof options === "number") {
        options = { seatRadiusFactor: options, ...getSeatsCentersOptions, ...getGroupedSVGOptions };
    }

    const precomputeReturn = precomputeFromAttribution(attribution, options);
    return getGroupedSVG(precomputeReturn.groupedSeatCenters, precomputeReturn.seatActualRadius, options);
}
