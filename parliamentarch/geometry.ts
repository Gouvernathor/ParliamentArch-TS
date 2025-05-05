// default angle, in degrees, coming from the rightmost seats through the center to the leftmost seats
const DEFAULT_SPAN_ANGLE = 180;

/**
 * Returns the thickness of a row in the same unit as the coordinates.
 * It is equal to the diameter of a single seat.
 *
 * If you divide the half-disk of the hemicycle into one half-disk of half the radius and one half-annulus outside of it,
 * the innermost row lies on the border between the two, and the outermost row lies entirely inside the half-annulus.
 * So, looking at the line cutting the circle and the annulus in half (which is the bottom border of the diagram),
 * all rows minus one half of the innermost are on the left, same on the right,
 * and the radius of the void at the center is equal to that value again.
 * So, total = 4 * (nRows-.5) = 4 * nRows - 2.
 */
export function getRowThickness(nRows: number): number {
    return 1 / (4 * nRows - 2);
}

/**
 * This indicates the maximal number of seats for each row for a given number of rows.
 * @returns an array of number of seats per row, from inner to outer.
 * The length of the array nRows.
 * spanAngle, if provided, is the angle in degrees that the hemicycle, as an annulus arc, covers.
 */
export function getRowsFromNRows(nRows: number, spanAngle = DEFAULT_SPAN_ANGLE): number[] {
    const rad = getRowThickness(nRows);
    const radianSpanAngle = Math.PI * spanAngle / 180;
    return Array.from({ length: nRows }, (_, r) => {
        const rowArcRadius = .5 + 2 * r * rad;
        return Math.floor(radianSpanAngle * rowArcRadius / (2 * rad));
    });
}

/**
 * Returns the minial number of rows necessary to contain nSeats seats.
 */
export function getNRowsFromNSeats(nSeats: number, spanAngle = DEFAULT_SPAN_ANGLE): number {
    let nRows = 1;
    while (getRowsFromNRows(nRows, spanAngle).reduce((a, b) => a + b, 0) < nSeats) {
        nRows++;
    }
    return nRows;
}

export enum FillingStrategy {
    /**
     * The seats are distributed among all the rows,
     * proportionally to the maximal number of seats each row can contain.
     */
    DEFAULT = "default",

    /**
     * Selects as few outermost rows as necessary, then distributes the seats among them,
     * proportionally to the maximal number of seats each row can contain.
     */
    EMPTY_INNER = "empty_inner",

    /**
     * Fills up the rows as much as possible, starting from the outermost ones.
     */
    OUTER_PRIORITY = "outer_priority",
}

export interface GetSeatsCentersOptions {
    minNRows: number;
    fillingStrategy: FillingStrategy;
    spanAngle: number;
}

/**
 * Computes the coordinates of the centers of the seats, with (as a bonus) the angle of each seat in the hemicycle.
 * The canvas is assumed to be 2 in width and 1 in height, with the x axis pointing right and the y axis pointing up.
 * The angle is calculated from the [1, 0] center of the hemicycle, in radians and in trigonometric positive direction,
 * tending to 0 for the rightmost seats, 90° or PI/2 for the center, and 180° or PI for the leftmost seats.
 * @param minNRows The minimal number of rows required to contain `nSeats` seats will be computed automatically.
 * If `minNRows` is greater, then that will be the number of rows, otherwise the parameter is ignored.
 * Passing a higher number of rows will make the diagram sparser,
 * for which non-default filling strategies are more adapted.
 * @param fillingStrategy determines how the seats are distributed among the rows, see the `FillingStrategy` enum.
 * @param spanAngle is the angle from the side of the rightmost seats,
 * through the center, to the side of the leftmost seats.
 * It takes a value in degrees and defaults to 180 to make a true hemicycle.
 * Values above 180 are not supported.
 * @returns a map whose keys are the seat centers as [x, y] coordinates, with the angle of the seat as values.
 */
export function getSeatsCenters(
    nSeats: number,
    {
        minNRows = 0,
        fillingStrategy = FillingStrategy.DEFAULT,
        spanAngle = DEFAULT_SPAN_ANGLE,
    }: Partial<GetSeatsCentersOptions> = {},
): Map<[number, number], number> {
    const nRows = Math.max(minNRows, getNRowsFromNSeats(nSeats, spanAngle));
    const rowThicc = getRowThickness(nRows);
    const spanAngleMargin = (1 - spanAngle / 180) * Math.PI / 2;

    const maxedRows = getRowsFromNRows(nRows, spanAngle);

    let startingRow, fillingRatio, seatsOnStartingRow;
    switch (fillingStrategy) {
        case FillingStrategy.DEFAULT:
            startingRow = 0;
            fillingRatio = nSeats / maxedRows.reduce((a, b) => a + b, 0);
            break;

        case FillingStrategy.EMPTY_INNER:
            {
                const rows = maxedRows.slice();
                while (rows.slice(1).reduce((a, b) => a + b, 0) >= nSeats) {
                    rows.shift();
                }
                // here, rows represents the rows which are enough to contain nSeats,
                // and their number of seats.

                // this row will be the first one to contain seats
                // the innermost ones are empty
                startingRow = nRows - rows.length;
                fillingRatio = nSeats / rows.reduce((a, b) => a + b, 0);
            }
            break;

        case FillingStrategy.OUTER_PRIORITY:
            {
                const rows = maxedRows.slice();
                while (rows.reduce((a, b) => a + b, 0) > nSeats) {
                    rows.shift();
                }
                // here, rows represents the rows which will be fully filled,
                // and their number of seats.

                // this row will be only one to be partially filled
                // the innermore ones are empty, the outermost ones are fully filled
                startingRow = nRows - rows.length - 1;
                seatsOnStartingRow = nSeats - rows.reduce((a, b) => a + b, 0);
            }
            break;

        default:
            throw new Error(`Invalid filling strategy: ${fillingStrategy}`);
    }

    const positions = new Map<[number, number], number>();
    for (let r = startingRow; r < nRows; r++) {
        let nSeatsThisRow: number;
        if (r === nRows - 1) { // if it's the last, outermost row
            // fit all the remaining seats
            nSeatsThisRow = nSeats - positions.size;
        } else if (fillingStrategy === FillingStrategy.OUTER_PRIORITY) {
            if (r === startingRow) {
                nSeatsThisRow = seatsOnStartingRow!;
            } else {
                nSeatsThisRow = maxedRows[r];
            }
        } else {
            // fullness of the diagram times the maximal number of seats in this row
            nSeatsThisRow = Math.round(fillingRatio! * maxedRows[r]);
            // actually more precise rounding : avoid rounding errors to accumulate too much
            // nSeatsThisRow = Math.round((nSeats-positions.size) * maxedRows[r] / maxedRows.reduce((a, b) => a + b, 0));
        }

        // row radius : the radius of the circle crossing the center of each seat in the row
        const rowArcRadius = .5 + 2 * r * rowThicc;

        if (nSeatsThisRow === 1) {
            positions.set([1, rowArcRadius], Math.PI / 2);
        } else {
            // the angle necessary in this row to put the first (and last) seats fully on the canvas
            const angleMargin = Math.asin(rowThicc / rowArcRadius)
                // add the margin to make up the side angle
                + spanAngleMargin;
            // alternatively, allow the centers of the seats by the side to reach the angle's limits
            // const angleMargin = Math.max(angleMargin, spanAngleMargin);

            // the angle separating two seats on that row
            const angleStep = (Math.PI - 2 * angleMargin) / (nSeatsThisRow - 1);
            // a fraction of the remaining space, keeping in mind that the same elevation
            // on start and end limits that remaining space to less than 2PI

            for (let s = 0; s < nSeatsThisRow; s++) {
                const angle = angleMargin + s * angleStep;
                // an oriented angle, so it goes trig positive (counterclockwise)
                positions.set([1 + rowArcRadius * Math.cos(angle), rowArcRadius * Math.sin(angle)], angle);
            }
        }
    }
    return positions;
}
