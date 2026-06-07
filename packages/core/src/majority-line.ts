import { getRowArcRadius, getRowThickness, SeatInfo } from "./geometry";

const sign = Math.sign as (n: number) => -1|0|1;

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
     * Not yet implemented.
     */
    ratio: number;
}
export interface LineCheckPoints {
    startPoint: Point;
    checkpoints: Point[];
    endPoint: Point;
    rowThickness: number;
}

export function getLineCheckPoints(seatCenters: SeatCenters, {
    round = Math.ceil,
    // ratio = .5, // TODO
}: Partial<Readonly<GetLineCheckPointsOptions>> = {}): LineCheckPoints {
    const isInRightPart = getIsInRightPart(seatCenters, round);
    const seatsPerRow = getSeatsPerRow(seatCenters);
    const rowThicc = getRowThickness(seatsPerRow.length);
    const maxSeatRadius = rowThicc/2;

    return {
        startPoint: [1, .5 - maxSeatRadius],
        checkpoints: getCheckpoints(seatsPerRow, rowThicc, maxSeatRadius, isInRightPart),
        endPoint: [1, 1],
        rowThickness: rowThicc,
    };
}

function getIsInRightPart(seatCenters: SeatCenters, round: Rounder) {
    const rightPart = new Set([...seatCenters.keys()]
        .sort((k1, k2) => seatCenters.get(k1)!.angle - seatCenters.get(k2)!.angle)
        .slice(0, seatCenters.size - round(seatCenters.size / 2)));
    return rightPart.has.bind(rightPart);
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
    isInRightPart: (p: Point) => boolean,
): Point[] {
    const checkpoints: Point[] = [];
    for (let rowIdx = 0; rowIdx < seatsPerRow.length; rowIdx++) {
        const row = seatsPerRow[rowIdx]!;
        const rowArcRadius = getRowArcRadius(rowIdx, rowThicc);
        const rowSide = getRowSide(row, isInRightPart);

        checkpoints.push([1 + rowSide*maxSeatRadius, 1-rowArcRadius]);
    }
    return checkpoints;
}

function getRowSide(row: readonly Point[], isInRightPart: (p: Point) => boolean): 0|-1|1 {
    if ((row.length%2) === 0) {
        return 0;
    }
    const nSeatsRightPartInRow = row.reduce((a, p) => isInRightPart(p) ? a+1 : a, 0);
    return sign((row.length/2) - nSeatsRightPartInRow);
}
