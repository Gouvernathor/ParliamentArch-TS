import { GetMajorityLineCheckpointsOptions } from "@parliamentarch/core/majority-line";
import { precomputeFromAttribution, PrecomputeOptions } from "@parliamentarch/core/utils";
import { getGroupedSVG, GetGroupedSVGOptions, MajorityLineDisplayData, SeatData } from "./implem.js";

export {
    ClassSeatData,
    StandaloneSeatData,
    SeatData,
    GetGroupedSVGOptions,
    getGroupedSVG,
} from "./implem.js";

export interface GetSVGFromAttributionOptions extends PrecomputeOptions, GetGroupedSVGOptions {
    majorityLines: readonly Partial<Readonly<MajorityLineDisplayData&GetMajorityLineCheckpointsOptions>>[];
}

export function getSVGFromAttribution(
    attribution: Parameters<typeof precomputeFromAttribution<SeatData>>[0],
    options?: Partial<Readonly<GetSVGFromAttributionOptions>>,
): SVGSVGElement {
    const { groupedSeatCenters, seatActualRadius, majorityLineCheckpoints } = precomputeFromAttribution(attribution, options);
    if (majorityLineCheckpoints.length) {
        const mlOptions = options!.majorityLines!;
        options = { ...options, majorityLineCheckpoints: majorityLineCheckpoints.map((c, i) => ({ ...mlOptions[i], ...c })) };
    }
    return getGroupedSVG(groupedSeatCenters, seatActualRadius, options);
}
