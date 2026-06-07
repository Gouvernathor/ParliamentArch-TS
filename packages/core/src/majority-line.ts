import { getRowArcRadius, getRowThickness, getSeatCenters } from "./geometry";

type Point = [number, number];
type SeatCenters = ReturnType<typeof getSeatCenters>;

export function getLineCheckPoints(seatCenters: SeatCenters) {
    const isInFirstHalf = getIsFirstHalf(seatCenters, /* TODO allow other rounding method */);
    const seatsPerRow = getSeatsPerRow(seatCenters);
    const rowThicc = getRowThickness(seatsPerRow.length);
    const maxSeatRadius = rowThicc/2;

    const startPoint: Point = [1, .5 - maxSeatRadius];
    const checkpoints = getCheckpoints(seatsPerRow, rowThicc, maxSeatRadius, isInFirstHalf);
    const endPoint: Point = [1, 1];

    return { startPoint, checkpoints, endPoint, rowThickness: rowThicc };
}

function getIsFirstHalf(seatCenters: SeatCenters, round = Math.round) {
    const firstHalf = new Set([...seatCenters.keys()]
        .sort((k1, k2) => seatCenters.get(k1)!.angle - seatCenters.get(k2)!.angle)
        .slice(0, round(seatCenters.size / 2)));
    return firstHalf.has.bind(firstHalf);
}

function getSeatsPerRow(seatCenters: SeatCenters): readonly (readonly Point[])[] {
    const rv: Point[][] = [];
    for (const [seatCenter, seatInfo] of seatCenters) {
        (rv[seatInfo.rowIdx] ??= []).push(seatCenter);
    }
    return rv;
}

function getCheckpoints(
    seatsPerRow: readonly (readonly Point[])[],
    rowThicc: number,
    maxSeatRadius: number,
    isInFirstHalf: (p: Point) => boolean,
): Point[] {
    const checkpoints: Point[] = [];
    for (let rowIdx = 0; rowIdx < seatsPerRow.length; rowIdx++) {
        const row = seatsPerRow[rowIdx]!;
        const rowArcRadius = getRowArcRadius(rowIdx, rowThicc);
        const rowSide = getRowSide(row, isInFirstHalf);

        checkpoints.push([1 + rowSide*maxSeatRadius, 1-rowArcRadius]);
    }
    return checkpoints;
}

function getRowSide(row: readonly Point[], isInFirstHalf: (p: Point) => boolean): 0|-1|1 {
    if ((row.length%2) === 0) {
        return 0;
    }
    const nSeatsFirstHalfInRow = row.reduce((a, p) => isInFirstHalf(p) ? a+1 : a, 0);
    return Math.sign((row.length/2) - nSeatsFirstHalfInRow) as -1|1;
}
