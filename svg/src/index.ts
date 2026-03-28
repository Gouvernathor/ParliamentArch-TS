import { precomputeFromAttribution, PrecomputeOptions } from "@parliamentarch/core/utils";
import { getGroupedSVG, GetGroupedSVGOptions, SeatData } from "./implem.js";

export {
    ClassSeatData,
    StandaloneSeatData,
    SeatData,
    GetGroupedSVGOptions,
    getGroupedSVG,
} from "./implem.js";

export interface GetSVGFromAttributionOptions extends PrecomputeOptions, GetGroupedSVGOptions {
}

export function getSVGFromAttribution(
    attribution: Parameters<typeof precomputeFromAttribution<SeatData>>[0],
    options?: Partial<GetSVGFromAttributionOptions>,
): SVGSVGElement {
    const precomputeReturn = precomputeFromAttribution(attribution, options);
    return getGroupedSVG(precomputeReturn.groupedSeatCenters, precomputeReturn.seatActualRadius, options);
}
