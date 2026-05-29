import { getNRows, getSeatCentersWithAngle, getSeatDistanceFactor, SeatCenter } from "../../core/src/geometryv2";
import generateSVG, { Seat } from "./svgv2";

export type Parliament = { [partyname: string]: { seats: number, colour: string } };

function tagSeatCenters(
    parliament: Parliament,
    xyWithAngle: Map<SeatCenter, number>,
): Seat[] {
    const sortedXY = [...xyWithAngle]
        .sort((a, b) => a[1] - b[1])
        .map(([xy, ]) => xy);
    const rv = [] as Seat[];
    let seatIdx = 0;
    for (const partyname in parliament) {
        const pSeats = parliament[partyname].seats;
        for (let pSeatIdx = 0; pSeatIdx < pSeats; pSeatIdx++, seatIdx++) {
            rv.push(Object.assign({ party: partyname }, sortedXY[seatIdx]));
        }
    }
    return rv;
}

function generatePoints(
    parliament: Parliament,
    outerRowRadius: number,
): Seat[] & { seatDistance: number } {
    const seatCount = Object.values(parliament)
        .map(v => v.seats)
        .reduce((a, b) => a + b, 0);
    const nRows = getNRows(seatCount);
    const seatDistance = getSeatDistanceFactor(seatCount, nRows) * outerRowRadius;

    const seatCentersWithAngle = getSeatCentersWithAngle(nRows, outerRowRadius, seatCount, seatDistance);

    const seats = tagSeatCenters(parliament, seatCentersWithAngle);

    return Object.assign(seats, { seatDistance });
}

export function psvg(
    parliament: Parliament,
    {seatCount = true, elementCreator = undefined, seatRadiusFactor = .4} = {},
): SVGSVGElement {
    const outerRowRadius = 20;
    const points = generatePoints(parliament, outerRowRadius);
    const parties = Object.fromEntries(Object.keys(parliament).map(partyname => [partyname, {fill: parliament[partyname].colour}]));
    return generateSVG(parties, points, outerRowRadius, points.seatDistance, {seatCount, elementCreator, seatRadiusFactor});
}
