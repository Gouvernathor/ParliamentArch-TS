import { getNRowsFromNSeats, getRowThickness, getSeatsCenters } from "./parliamentarch/geometry";
import { dispatchSeats, getGroupedSVG, SeatData } from "./parliamentarch/svg";

export { SeatData } from "./parliamentarch/svg";

export function getSVGFromAttribution(
    attribution: Map<SeatData, number>,
    seatRadiusFactor: number = .8,
    getSeatsCentersOptions: object = {},
    getGroupedSVGOptions: object = {},
): SVGSVGElement {
    const nSeats = [...attribution.values()].reduce((a, b) => a + b, 0);

    const results = getSeatsCenters(nSeats, getSeatsCentersOptions);
    const seatCentersByGroup = dispatchSeats(attribution, [...results.keys()].sort((a, b) => results.get(b)! - results.get(a)!));
    const seatActualRadius = seatRadiusFactor * getRowThickness(getNRowsFromNSeats(nSeats));
    return getGroupedSVG(seatCentersByGroup, seatActualRadius, getGroupedSVGOptions);
}
