export type Parliament = {[partyname: string]: {seats: number, colour: string}};
export type Seat = {x: number, y: number, r: number, fill: string, party: string};

function seatSum(p: Parliament) {
    return Array.from(Object.values(p), v => v.seats).reduce((a, b) => a + b, 0);
}

function calculateNumberOfRows(seatCount: number, r0: number) {
    let n = Math.floor(Math.log(seatCount) / Math.log(2)) || 1;
    let distance = score(seatCount, n, r0);

    let direction = 0;
    if (score(seatCount, n + 1, r0) < distance) {
        direction = 1;
    }
    if (score(seatCount, n - 1, r0) < distance && n > 1) {
        direction = -1;
    }

    while (score(seatCount, n + direction, r0) < distance && n > 0) {
        distance = score(seatCount, n + direction, r0);
        n += direction;
    }
    return n;
}

function calculateSeatDistance(seatCount: number, numberOfRows: number, r0: number) {
    return (Math.PI * numberOfRows * r0) /
        ((seatCount - numberOfRows) + (Math.PI * (numberOfRows - 1) * numberOfRows/2));
}

function score(seatCount: number, n: number, r0: number) {
    return Math.abs(calculateSeatDistance(seatCount, n, r0) * n / r0 - 5/7);
}

/**
 * Proportional attribution of seats to rows
 * Previously done with the sainte-laguë method (through a dependency),
 * toned down to a simpler and faster version
 */
function distributeSeatsToRows(
    partyscores: ReadonlyArray<number>,
    total: number,
): number[] {
    const sumScores = partyscores.reduce((a, b) => a + b, 0);
    const nRows = partyscores.length;
    const rv = Array(nRows) as number[];
    let acc = 0;
    let remainingScores = sumScores;

    for (let i = 0; i < nRows-1; i++) {
        // every row is best rounded except the last that cumulates all rounding errors
        // acc += rv[i] = Math.round(partyscores[i] * total / sumScores);
        // more precise rounding : avoid rounding errors to accumulate too much
        acc += rv[i] = Math.round((total-acc) * partyscores[i] / remainingScores);
        remainingScores -= partyscores[i];
    }

    rv[nRows-1] = total - acc;
    return rv;
}

function coords(rowRadius: number, b: number) {
    return {
        x: rowRadius * Math.cos(b/rowRadius - Math.PI),
        y: rowRadius * Math.sin(b/rowRadius - Math.PI),
    }
}

function nextRow(
    rows: ReadonlyArray<ReadonlyArray<unknown>>,
    rowProgress: ReadonlyArray<number>,
) {
    const quotas = rows.map((row, i) => (rowProgress[i] || 0) / row.length);
    return quotas.indexOf(Math.min(...quotas));
}

export default function generatePoints(parliament: Parliament, r0: number, seatRadiusFactor: number): Seat[] {
    const seatCount = seatSum(parliament);
    const numberOfRows = calculateNumberOfRows(seatCount, r0);
    const seatDistance = calculateSeatDistance(seatCount, numberOfRows, r0);

    // calculate row radii
    const rowRadii = Array.from({length: numberOfRows}, (_, i) =>
        r0 - i * seatDistance);

    // calculate seats per row
    const seatsPerRow = distributeSeatsToRows(rowRadii, seatCount);
    // Warning: not an array, but a non-sparse number:number object
    // (meaning that length and array methods are missing, only indexing works)

    const pointCoordinatesPerRow = rowRadii.map((radius, rowIdx) => {
        // calculate row-specific distance (of what ?)
        const a = (Math.PI * radius) / ((radius - 1) || 1);

        return Array.from({length: seatsPerRow[rowIdx]}, (_, seatIdx) =>
            ({...coords(radius, a * seatIdx), r: seatRadiusFactor * seatDistance}));
    });

    // fill the seats
    const rowProgress = Array(numberOfRows).fill(0);
    const seats: Seat[][] = Array.from({length: numberOfRows}).map(() => []);
    for (const partyname in parliament) {
        for (let i = 0; i < parliament[partyname].seats; i++) {
            const row = nextRow(pointCoordinatesPerRow, rowProgress);
            seats[row].push({
                ...pointCoordinatesPerRow[row][seats[row].length],
                fill: parliament[partyname].colour,
                party: partyname,
            });
            rowProgress[row]++;
        }
    }

    return seats.flat();
}
