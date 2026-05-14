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
    options?: Partial<Readonly<GetSVGFromAttributionOptions>>,
): SVGSVGElement {
    const { groupedSeatCenters, seatActualRadius } = precomputeFromAttribution(attribution, options);
    return getGroupedSVG(groupedSeatCenters, seatActualRadius, options);
}
