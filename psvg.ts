import generatePoints, { Parliament } from "./psvg/geometry";
import generateSVG from "./psvg/svg";

export function psvg(
    parliament: Parliament,
    {seatCount = true, elementCreator = undefined, seatRadiusFactor = .8} = {},
): SVGSVGElement {
    const radius = 20;
    const points = generatePoints(parliament, radius, seatRadiusFactor);
    const seatDistance = points[0].r / seatRadiusFactor;
    return generateSVG(points, radius, seatDistance, {seatCount, elementCreator});
}
