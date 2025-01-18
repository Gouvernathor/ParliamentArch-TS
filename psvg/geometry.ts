export type Parliament = {[partyname: string]: {seats: number, colour: string}};
type XYR = {x: number, y: number, r: number};
export type Seat = XYR & {party: string};

/**
 * Returns a number such that, when multiplied by the radius of the outermost row,
 * gives the standard seat distance.
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

function getXYRPerRow(
    numberOfRows: number,
    outerRowRadius: number,
    seatCount: number,
    seatRadiusFactor: number,
    seatDistance: number,
): XYR[][] {
    // calculate row radii
    const rowRadii = Array.from({length: numberOfRows}, (_, i) =>
        outerRowRadius - i * seatDistance);

    // calculate seats per row
    const nSeatsPerRow = distributeSeatsToRows(rowRadii, seatCount);

    return rowRadii.map((radius, rowIdx) => {
        // calculate row-specific distance (of what ?)
        const a = (Math.PI * radius) / ((radius - 1) || 1);

        return Array.from({length: nSeatsPerRow[rowIdx]}, (_, seatIdx) =>
            ({...coords(radius, a * seatIdx), r: seatRadiusFactor * seatDistance}));
    });
}

function getFlatSeats(
    parliament: Parliament,
    xyrPerRow: XYR[][],
    numberOfRows: number,
): Seat[] {
    const rowProgress = Array(numberOfRows).fill(0);
    const seatsPerRow: Seat[][] = rowProgress.map(() => []);
    for (const partyname in parliament) {
        for (let i = 0; i < parliament[partyname].seats; i++) {
            const row = nextRow(xyrPerRow, rowProgress);
            seatsPerRow[row].push({
                ...xyrPerRow[row][seatsPerRow[row].length],
                party: partyname,
            });
            rowProgress[row]++;
        }
    }

    return seatsPerRow.flat();
}

export default function generatePoints(
    parliament: Parliament,
    outerRowRadius: number,
    seatRadiusFactor: number,
): Seat[] & {seatDistance: number} {
    const seatCount = Object.values(parliament).map(v => v.seats).reduce((a, b) => a + b, 0);
    const numberOfRows = getNRows(seatCount);
    const seatDistance = getSeatDistanceFactor(seatCount, numberOfRows) * outerRowRadius;

    const xyrPerRow = getXYRPerRow(numberOfRows, outerRowRadius, seatCount, seatRadiusFactor, seatDistance);

    const seats = getFlatSeats(parliament, xyrPerRow, numberOfRows);

    return Object.assign(seats, {seatDistance});
}
