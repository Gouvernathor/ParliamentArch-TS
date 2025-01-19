export type Parliament = {[partyname: string]: {seats: number, colour: string}};
type SeatCenter = {x: number, y: number};
export type Seat = SeatCenter & {party: string};

/**
 * Returns a number such that, when multiplied by the radius of the outermost row,
 * gives the minimal distance between any two seats.
 *
 * The details of the calculation remain mysterious.
 * In particular, the denominator, and inside it, why a difference is computed
 * between a number of seats and a number of rows.
 * Or why pi, after being multiplied by a number of rows squared,
 * can be summed with that difference.
 */
function getSeatDistanceFactor(seatCount: number, nRows: number) {
    return (Math.PI * nRows) / // perimeter of the outermost row
        (seatCount - nRows + (Math.PI * (nRows - 1) * nRows/2));
}

/**
 * Makes the thickness of the hemicycle
 * (from the inner side of the innermost row to the outer side of the outermost row)
 * as close to 5/7 of the outermost row radius as possible.
 * I.e, makes the "well" as close to 2/7 in radius (or 4/7 in diameter) as possible.
 *
 * Keep in mind that since the outermost seats' *centers* are on the outer limit,
 * rather than the outer side of those seats, the well ends up larger than this.
 */
function score(seatCount: number, nRows: number) {
    return Math.abs(getSeatDistanceFactor(seatCount, nRows) * nRows - 5/7);
}

/**
 * Gradient descent following the score function.
 */
function getNRows(seatCount: number) {
    let n = Math.floor(Math.log2(seatCount)) || 1;
    let distance = score(seatCount, n);

    let direction = 0;
    if (n > 1 && score(seatCount, n - 1) < distance) {
        direction = -1;
    } else if (score(seatCount, n + 1) < distance) {
        direction = 1;
    }

    while (n > 0 && score(seatCount, n + direction) < distance) {
        distance = score(seatCount, n + direction);
        n += direction;
    }
    return n;
}

/**
 * Proportional attribution of seats to rows
 * Previously done with the sainte-laguë method (through a dependency),
 * toned down to a simpler and faster version
 */
function distributeSeatsToRows(
    rowWeights: ReadonlyArray<number>,
    total: number,
): number[] {
    const sumWeights = rowWeights.reduce((a, b) => a + b, 0);
    const nRows = rowWeights.length;
    const rv = Array(nRows) as number[];
    let acc = 0;
    let remainingWeight = sumWeights;

    for (let i = 0; i < nRows-1; i++) {
        // every row is best rounded except the last that cumulates all rounding errors
        // acc += rv[i] = Math.round(partyscores[i] * total / sumScores);
        // more precise rounding : avoid rounding errors to accumulate too much
        acc += rv[i] = Math.round((total-acc) * rowWeights[i] / remainingWeight);
        remainingWeight -= rowWeights[i];
    }

    // the last row gets the rounding errors anyway, since it's the largest
    rv[nRows-1] = total - acc;
    return rv;
}

function polarToCartesian(rowRadius: number, angle: number) {
    return {
        x: rowRadius * Math.cos(angle - Math.PI),
        y: rowRadius * Math.sin(angle - Math.PI),
    }
}

function getSeatCentersWithAngle(
    nRows: number,
    outerRowRadius: number,
    seatCount: number,
    seatDistance: number,
) {
    // calculate row radii
    const rowRadii = Array.from({length: nRows}, (_, i) =>
        outerRowRadius - i * seatDistance);

    // calculate number of seats per row
    const nSeatsPerRow = distributeSeatsToRows(rowRadii, seatCount);

    const rv = new Map<SeatCenter, number>();
    for (let rowIdx = 0; rowIdx < rowRadii.length; rowIdx++) {
        const nSeatsThisRow = nSeatsPerRow[rowIdx];
        if (nSeatsThisRow === 0) {
            continue;
        }
        const rowRadius = rowRadii[rowIdx];
        // angle increment between seats of this row
        const angleStep = Math.PI / (nSeatsThisRow - 1);

        for (let seatIdx = 0; seatIdx < nSeatsThisRow; seatIdx++) {
            const angle = angleStep * seatIdx;
            rv.set(polarToCartesian(rowRadius, angle), angle);
        }
    }
    return rv;
}

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
            rv.push(Object.assign({party: partyname}, sortedXY[seatIdx]));
        }
    }
    return rv;
}

export default function generatePoints(
    parliament: Parliament,
    outerRowRadius: number,
): Seat[] & {seatDistance: number} {
    const seatCount = Object.values(parliament)
        .map(v => v.seats)
        .reduce((a, b) => a + b, 0);
    const nRows = getNRows(seatCount);
    const seatDistance = getSeatDistanceFactor(seatCount, nRows) * outerRowRadius;

    const seatCentersWithAngle = getSeatCentersWithAngle(nRows, outerRowRadius, seatCount, seatDistance);

    const seats = tagSeatCenters(parliament, seatCentersWithAngle);

    return Object.assign(seats, {seatDistance});
}
