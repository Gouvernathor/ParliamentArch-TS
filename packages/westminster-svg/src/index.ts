import { getSeatCoordinatesPerArea, GeometryOptions } from "@parliamentarch/westminster-core/geometry";
import { AnyAttribution, anyAttributionToNSeatsPerPartyPerArea } from "@parliamentarch/westminster-core/utils";
import { getSVG, GetSVGOptions, SeatData } from "./implem.js";

export {
    ClassSeatData,
    StandaloneSeatData,
    SeatData,
    GetSVGOptions,
    getSVG,
} from "./implem.js";

export interface GetSVGFromAttributionOptions extends GeometryOptions, GetSVGOptions {
}

export function getSVGFromAttribution(
    attribution: AnyAttribution<SeatData>,
    options: Partial<Readonly<GetSVGFromAttributionOptions>> = {},
): SVGSVGElement {
    return getSVG(
        getSeatCoordinatesPerArea(
            anyAttributionToNSeatsPerPartyPerArea(attribution),
            options),
        options);
}
