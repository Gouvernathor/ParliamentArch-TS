import { getNRowsFromNSeats, getRowArcRadius, getRowThickness } from "./geometry";

type Point = readonly [number, number];

export function getLineCheckPointsSimple(nSeats: number) {
    const nRows = getNRowsFromNSeats(nSeats);
    // const maxedRows = getRowsFromNRows(nRows);
    const rowThicc = getRowThickness(nRows);

    // need to get the actual number of seats per row
    // from inner to outer
    const actualNSeatsPerRow: number[] = null!;

    // intersections of rows, from inner to outer
    const checkpoints: Point[] = [];
    let rowIdx = 0;
    for (const rowNSeats of actualNSeatsPerRow) {
        const rowArcRadius = getRowArcRadius(rowIdx, rowThicc);
        let xOffset;
        if ((rowNSeats%2) === 0) {
            xOffset = 0;
        } else {
            // first issue : finding whether to go to the left or right
            // then, move along the perimeter from the midpoint, by half of rowThicc
            xOffset = rowThicc/2;
            // TODO change the sign of this value depending on going to the left or right
        }
        checkpoints.push([1+xOffset, 1-rowArcRadius]);
    }

    const startPoint: Point = [1, .5 - rowThicc/2];
    const endPoint: Point = [1, 1];
}
