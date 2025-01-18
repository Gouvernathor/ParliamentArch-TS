export type Parliament = {[partyname: string]: {seats: number, colour: string}};
type SeatCenter = {x: number, y: number};
export type Seat = SeatCenter & {party: string};

/**
 * Returns a number such that, when multiplied by the radius of the outermost row,
 * gives the minimal distance between any two seats.
 */
function getSeatDistanceFactor(seatCount: number, numberOfRows: number) {
    return (Math.PI * numberOfRows) /
        (seatCount - numberOfRows + (Math.PI * (numberOfRows - 1) * numberOfRows/2));
}

function score(seatCount: number, n: number) {
    return Math.abs(getSeatDistanceFactor(seatCount, n) * n - 5/7);
}

function getNRows(seatCount: number) {
    let n = Math.floor(Math.log(seatCount) / Math.log(2)) || 1;
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
    numberOfRows: number,
    outerRowRadius: number,
    seatCount: number,
    seatDistance: number,
) {
    // calculate row radii
    const rowRadii = Array.from({length: numberOfRows}, (_, i) =>
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
    const numberOfRows = getNRows(seatCount);
    const seatDistance = getSeatDistanceFactor(seatCount, numberOfRows) * outerRowRadius;

    const seatCentersWithAngle = getSeatCentersWithAngle(numberOfRows, outerRowRadius, seatCount, seatDistance);

    const seats = tagSeatCenters(parliament, seatCentersWithAngle);

    return Object.assign(seats, {seatDistance});
}
