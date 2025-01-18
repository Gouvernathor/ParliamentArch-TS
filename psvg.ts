import generatePoints, { Parliament } from "./psvg/geometry";
import generateSVG from "./psvg/svg";

export function psvg(
    parliament: Parliament,
    {seatCount = true, elementCreator = undefined, seatRadiusFactor = .8} = {},
): SVGSVGElement {
    const radius = 20;
    const points = generatePoints(parliament, radius, seatRadiusFactor);
    return generateSVG(points, radius, points.seatDistance, {seatCount, elementCreator});
}
