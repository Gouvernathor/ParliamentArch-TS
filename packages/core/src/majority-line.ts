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
/**
 * Represents all the base points necessary to draw a line (ideally a bezier curve)
 * zigzagging between the seats to represent a majority.
 * The base points are provided, as well as values to help create control points.
 */
export interface LineCheckPoints {
    /** The starting point, on the inner side of the arch. */
    startPoint: Point;

    /**
     * A list of points, one for each row
     * (though not necessarily placed exactly on the row's half-circle),
     * from inner to outer.
     */
    checkpoints: Point[];

    /** The end point, on the outer side of the arch. */
    endPoint: Point;

    /**
     * The row thickness.
     * Can help place the control points from each base point,
     * offset by some factor times that value,
     * for instance towards the center of the diagram,
     * or parallel to the direction set by the ratio.
     */
    rowThickness: number;
}

export function getLineCheckPoints(seatCenters: SeatCenters, {
    round = Math.ceil,
    ratio = .5,
}: Partial<Readonly<GetLineCheckPointsOptions>> = {}): LineCheckPoints {
    const isInRightPart = getIsInRightPart(seatCenters, round, ratio);
    const seatsPerRow = getSeatsPerRow(seatCenters);
    const rowThicc = getRowThickness(seatsPerRow.length);
    const maxSeatRadius = rowThicc/2;

    const checkpoints = (ratio === .5) ?
        getCheckpointsForHalf(seatsPerRow, rowThicc, maxSeatRadius, isInRightPart) :
        getCheckpoints(seatsPerRow, rowThicc, maxSeatRadius, isInRightPart, ratio);

    return {
        startPoint: [1, .5 - maxSeatRadius],
        checkpoints,
        endPoint: [1, 1],
        rowThickness: rowThicc,
    };
}

function getIsInRightPart(seatCenters: SeatCenters, round: Rounder, ratio: number) {
    const rightPart = new Set([...seatCenters.keys()]
        .sort((k1, k2) => seatCenters.get(k1)!.angle - seatCenters.get(k2)!.angle)
        .slice(0, seatCenters.size - round(seatCenters.size * ratio)));
    return rightPart.has.bind(rightPart);
}

function getSeatsPerRow(seatCenters: SeatCenters): readonly (readonly Point[])[] {
    const rv: Point[][] = [];
    for (const [seatCenter, seatInfo] of seatCenters) {
        (rv[seatInfo.rowIdx] ??= []).push(seatCenter);
    }
    return rv;
}

function getCheckpointsForHalf(
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

/*
multi-point placement with non-half ratio

for each row
Find the two boundary seats
If there is none, use the straight point line (on the row semi-circle and whose angle is the ratio) and move on to the next row.
If there is two, comparing by angle, keep the seat nearest to the ratio angle.
Test whether the straight line would be within maxSeatRadius (=rowThickness/2) of the seat.
If not, take the straight point.
If so, then put the line on the side of the seat depending on which part it's in,
and either (1) the point at a maxSeatRadius distance of the seat and on a perpendicular to the straight line passing through the seat,
or (2) the point at a maxSeatRadius distance of the seat and on the row's base semicircle.

in case (1) the control point is offset by a vector colinear to the straight line and whose norm is the offset value
in case (2) the control point is a polar point from the center of the diagram,
whose angle is the same as the point and whose distance is the point's minus (or plus) the offset value
*/
function getCheckpoints(
    seatsPerRow: readonly (readonly Point[])[],
    rowThicc: number,
    maxSeatRadius: number,
    isInRightPart: (value: Point) => boolean,
    ratio: number,
): Point[] {
    const ratioAngle = ratio * Math.PI/2;

    const checkpoints: Point[] = [];
    for (let rowIdx = 0; rowIdx < seatsPerRow.length; rowIdx++) {
        const row = seatsPerRow[rowIdx]!;
        const [leftSeat, rightSeat] = getBoundarySeats(row, isInRightPart, ratioAngle);
        //
    }
    return checkpoints;
}

function getBoundarySeats(
    row: readonly Point[],
    isInRightPart: (value: Point) => boolean,
    ratioAngle: number,
): [Point|null, Point|null] {
    throw 0;
}
