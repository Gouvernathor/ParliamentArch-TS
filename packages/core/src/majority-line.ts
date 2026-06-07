import { getRowArcRadius, getRowThickness, SeatInfo } from "./geometry";

type Point = [number, number];
type SeatCenters = ReadonlyMap<Point, SeatInfo>;
type Rounder = (n: number) => number;

export interface GetLineCheckPointsOptions {
    /**
     * Used to round the sharing of the assembly.
     * Rounding up means more seats to the left.
     * Defaults to Math.ceil,
     * which rounds to the higher closest integer.
     */
    round: Rounder;

    /**
     * A value between 0 and 1
     * representing the share of the seats that will be on the left.
     * Defaults to .5.
     */
    // ratio: number; // not yet implemented
}
export interface LineCheckPoints {
    startPoint: Point;
    checkpoints: Point[];
    endPoint: Point;
    rowThickness: number;
}

export function getLineCheckPoints(seatCenters: SeatCenters, {
    round = Math.ceil,
}: Partial<Readonly<GetLineCheckPointsOptions>> = {}): LineCheckPoints {
    const isInFirstHalf = getIsFirstHalf(seatCenters, round);
    const seatsPerRow = getSeatsPerRow(seatCenters);
    const rowThicc = getRowThickness(seatsPerRow.length);
    const maxSeatRadius = rowThicc/2;

    return {
        startPoint: [1, .5 - maxSeatRadius],
        checkpoints: getCheckpoints(seatsPerRow, rowThicc, maxSeatRadius, isInFirstHalf),
        endPoint: [1, 1],
        rowThickness: rowThicc,
    };
}

function getIsFirstHalf(seatCenters: SeatCenters, round: Rounder) {
    const firstHalf = new Set([...seatCenters.keys()]
        .sort((k1, k2) => seatCenters.get(k1)!.angle - seatCenters.get(k2)!.angle)
        .slice(0, seatCenters.size - round(seatCenters.size / 2)));
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
