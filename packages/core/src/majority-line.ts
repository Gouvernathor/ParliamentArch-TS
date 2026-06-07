import { getNRowsFromNSeats, getRowArcRadius, getRowThickness, getSeatCenters, GetSeatCentersOptions } from "./geometry";

type Point = readonly [number, number];
type SeatCenters = ReturnType<typeof getSeatCenters>;

export function getLineCheckPointsSimple(seatCenters: SeatCenters, { spanAngle }: Partial<Readonly<GetSeatCentersOptions>>) {
    const nSeats = seatCenters.size;
    const nRows = getNRowsFromNSeats(nSeats, spanAngle);
    const rowThicc = getRowThickness(nRows);
    const maxSeatRadius = rowThicc/2;
    const firstHalf = getFirstHalf(seatCenters, /* TODO allow other rounding method */);
    const isInFirstHalf = (p: Point) => firstHalf.includes(p);

    const seatsPerRow = getSeatsPerRow(seatCenters);

    const checkpoints: Point[] = [];
    for (let rowIdx = 0; rowIdx < seatsPerRow.length; rowIdx++) {
        const row = seatsPerRow[rowIdx]!;
        const rowArcRadius = getRowArcRadius(rowIdx, rowThicc);
        const rowSide = getRowSide(row, isInFirstHalf);

        checkpoints.push([1 + rowSide*maxSeatRadius, 1-rowArcRadius]);
    }

    const startPoint: Point = [1, .5 - maxSeatRadius];
    const endPoint: Point = [1, 1];
}

function getFirstHalf(seatCenters: SeatCenters, round = Math.round): readonly Point[] {
    const sorted = [...seatCenters.keys()].sort((k1, k2) => seatCenters.get(k1)!.angle - seatCenters.get(k2)!.angle);
    return sorted.slice(0, round(seatCenters.size / 2));
}

function getSeatsPerRow(seatCenters: SeatCenters): readonly (readonly Point[])[] {
    const rv: Point[][] = [];
    for (const [seatCenter, seatInfo] of seatCenters) {
        (rv[seatInfo.rowIdx] ??= []).push(seatCenter);
    }
    return rv;
}

function getRowSide(row: readonly Point[], isInFirstHalf: (p: Point) => boolean): 0|-1|1 {
    if ((row.length%2) === 0) {
        return 0;
    }
    const nSeatsFirstHalfInRow = row.reduce((a, p) => isInFirstHalf(p) ? a+1 : a, 0);
    return Math.sign((row.length/2) - nSeatsFirstHalfInRow) as -1|1;
}
