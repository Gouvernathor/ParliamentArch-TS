import { getSeatCoordinatesPerArea, Options as GeometryOptions } from "@parliamentarch/westminster-core/geometry";
import { AnyAttribution, anyAttributionToNSeatsPerPartyPerArea } from "@parliamentarch/westminster-core/attributions";
import { buildSVG, Options as SVGOptions, Party } from "./implem.js";

export { Party };

interface Options extends GeometryOptions, SVGOptions {}
export { Options as GetSVGFromAttributionOptions };

export function getSVGFromAttribution(
    attribution: AnyAttribution<Party>,
    options: Partial<Readonly<Options>> = {},
): SVGSVGElement {
    return buildSVG(
        getSeatCoordinatesPerArea(
            anyAttributionToNSeatsPerPartyPerArea(attribution),
            options),
        options);
}
