import { SeatData } from "./implem.js";
import { getNRows, getSeatCentersWithAngle, getSeatDistanceFactor, SeatCenter } from "../../core/src/geometryv2.js";
import generateSVG, { TaggedSeat, SeatData as SeatDataV2 } from "./svgv2.js";

export type Parliament = {
    [partyname: string]: SeatDataV2 & {
        seats: number;
    };
};

export function parliamentToAttribution(
    parliament: Parliament,
) {
    return new Map(Object.entries(parliament).map(([name, { seats, colour }]) =>
        [{ color: colour, data: name } as SeatData, seats] as const));
}

function tagSeatCenters(
    parliament: Parliament,
    xyWithAngle: ReadonlyMap<Readonly<SeatCenter>, number>,
): TaggedSeat[] {
    const sortedXY = [...xyWithAngle]
        .sort((a, b) => a[1] - b[1])
        .map(([xy, ]) => xy);
    const rv = [] as TaggedSeat[];
    let seatIdx = 0;
    for (const partyname in parliament) {
        const pSeats = parliament[partyname]!.seats;
        for (let pSeatIdx = 0; pSeatIdx < pSeats; pSeatIdx++, seatIdx++) {
            rv.push(Object.assign({ party: partyname }, sortedXY[seatIdx]));
        }
    }
    return rv;
}

function generatePoints(
    parliament: Parliament,
    outerRowRadius: number,
): TaggedSeat[] & { seatDistance: number } {
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
    { seatCount = true, elementCreator = undefined, seatRadiusFactor = .4 } = {},
): SVGSVGElement {
    const outerRowRadius = 20;
    const points = generatePoints(parliament, outerRowRadius);
    return generateSVG(parliament, points, outerRowRadius, points.seatDistance, {seatCount, elementCreator, seatRadiusFactor});
}
