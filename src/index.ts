import { getNRowsFromNSeats, getRowThickness, getSeatsCenters, type GetSeatsCentersOptions } from "./geometry.js";
import { dispatchSeats, getGroupedSVG, type GetGroupedSVGOptions, type SeatData, type SeatDataWithNumber } from "./svg.js";

export { type SeatData, type SeatDataWithNumber } from "./svg.js";

export function getSVGFromAttribution(
    attribution: Map<SeatData, number> | SeatDataWithNumber[],
    seatRadiusFactor: number = .8,
    getSeatsCentersOptions: Partial<GetSeatsCentersOptions> = {},
    getGroupedSVGOptions: Partial<GetGroupedSVGOptions> = {},
): SVGSVGElement {
    if (!(attribution instanceof Map)) {
        attribution = new Map(attribution.map(seatData => [seatData, seatData.nSeats ?? 1]));
    }

    const nSeats = [...attribution.values()].reduce((a, b) => a + b, 0);

    const results = getSeatsCenters(nSeats, getSeatsCentersOptions);
    const seatCentersByGroup = dispatchSeats(attribution, [...results.keys()].sort((a, b) => results.get(b)! - results.get(a)!));
    const seatActualRadius = seatRadiusFactor * getRowThickness(getNRowsFromNSeats(nSeats));
    return getGroupedSVG(seatCentersByGroup, seatActualRadius, getGroupedSVGOptions);
}
