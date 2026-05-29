import generatePoints, { Parliament } from "../../core/src/geometryv2";
import generateSVG from "./svgv2";

export function psvg(
    parliament: Parliament,
    {seatCount = true, elementCreator = undefined, seatRadiusFactor = .4} = {},
): SVGSVGElement {
    const outerRowRadius = 20;
    const points = generatePoints(parliament, outerRowRadius);
    const parties = Object.fromEntries(Object.keys(parliament).map(partyname => [partyname, {fill: parliament[partyname].colour}]));
    return generateSVG(parties, points, outerRowRadius, points.seatDistance, {seatCount, elementCreator, seatRadiusFactor});
}
