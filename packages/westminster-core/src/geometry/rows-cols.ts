import { Area, areaRecord, RowCols } from "../common.js";
import { Options } from "./common.js";

/**
 * Number of seats for each party for each area, except the typing is a bit more lax.
 * Both arrays and maps fit the required type for storing the parties in each area.
 */
export type NSeatsIterablePerArea = {
    readonly [a in Area]: {
        values(): Iterable<number>;
    };
};

/**
 * Number of occupied seats for each area.
 */
type NSeatsPerArea = {
    readonly [a in Area]: number;
};

/**
 * Number of rows and columns for each area.
 */
export type NRowsAndColsPerArea = {
    readonly [a in Area]: RowCols;
};

/**
 * @param ares the number of seats for each party and for each area
 * @returns How many rows and columns are required for each area,
 * including any empty seats.
 */
export function getRowsAndColsPerArea(
    ares: NSeatsIterablePerArea,
    {
        wingNRows: requestedWingNRows,
        crossNCols: requestedCrossNCols,
        packed,
        // fullWidth,
    }: Readonly<Options>,
): NRowsAndColsPerArea {
    const requestedHera = makeRequestedHera(ares);
    if (requestedHera.cross === 0 || requestedCrossNCols < requestedHera.cross) {
        requestedCrossNCols = 0;
    }

    const sanityCheck = requestedHera.speak + requestedHera.opposition + requestedHera.government + requestedHera.cross;
    if (!Number.isSafeInteger(sanityCheck)) {
        throw new Error("Invalid number(s) of seats");
    }

    for (let widthInSquares = 2*Math.max(4, requestedHera.speak, Math.min(requestedCrossNCols, requestedHera.cross));
         widthInSquares < 8*sanityCheck;
         widthInSquares++) {
        const heightInSquares = Math.trunc(widthInSquares / 2);

        if (heightInSquares < requestedHera.speak) continue;
        if (requestedWingNRows && (heightInSquares < 2*requestedWingNRows+2)) continue;

        const maxWingRows = requestedWingNRows || Math.trunc(heightInSquares/2 - 1);

        // accounts for packing, but not for cross
        const minWingCols = getMinWingCols(ares, requestedHera, maxWingRows, packed);

        // if it's too much, even without cross and with packing, then bail
        if (widthInSquares < minWingCols+1) continue;

        let proposedCrossRowCols: RowCols;
        if (requestedHera.cross === 0) {
            proposedCrossRowCols = { nRows: 0, nCols: 0 };
            // x fitness check already made
        } else {
            if (requestedCrossNCols > 0) {
                proposedCrossRowCols = { nRows: Math.ceil(requestedHera.cross/requestedCrossNCols), nCols: requestedCrossNCols };
            } else {
                const maxCrossCols = widthInSquares -minWingCols -1/* speaker */;
                proposedCrossRowCols = { nRows: Math.ceil(requestedHera.cross/maxCrossCols), nCols: maxCrossCols };
            }
            if (widthInSquares < 1/* speaker */ +minWingCols +1/* gap between wings and cross */ +proposedCrossRowCols.nCols) continue;
        }
        const proposedWingRowCols = {
            nRows: maxWingRows,
            nCols: minWingCols,
        };

        const fit = howDoesItFit(proposedWingRowCols, proposedCrossRowCols, { heightInSquares, widthInSquares }, ares, requestedHera, { packed });
        if (fit) {
            const cross = arrangeCross(fit, requestedHera.cross, requestedCrossNCols, widthInSquares);
            return {
                speak: { nRows: requestedHera.speak, nCols: 1 },
                opposition: { nRows: maxWingRows, nCols: fit.oppositionNecessaryCols },
                government: { nRows: maxWingRows, nCols: fit.governmentNecessaryCols },
                cross,
            };
        }
    }

    throw new Error("Could not find a proper number of rows and columns");
}

function makeRequestedHera(ares: NSeatsIterablePerArea): NSeatsPerArea {
    return areaRecord(area => {
        let nSeats = 0;
        for (const n of ares[area].values()) {
            nSeats += n;
        }
        return nSeats;
    });
}

/**
 * Takes packing into account but not crossbenchers
 */
function getMinWingCols(
    ares: NSeatsIterablePerArea,
    requestedHera: NSeatsPerArea,
    maxWingRows: number,
    packed: boolean,
): number {
    if (packed) {
        return Math.ceil(Math.max(requestedHera.opposition, requestedHera.government) / maxWingRows);
    } else {
        return Math.max(
            reduceNotPacked(ares.government.values(), maxWingRows),
            reduceNotPacked(ares.opposition.values(), maxWingRows),
        );
    }
}

interface Fitness {
    oppositionNecessaryCols: number;
    governmentNecessaryCols: number;
    crossNecessaryRows: number;
}
function howDoesItFit(
    { nRows: wingRows, nCols: wingCols }: RowCols,
    { nRows: crossRows, nCols: crossCols }: RowCols,
    {
        heightInSquares, widthInSquares,
    }: {
        heightInSquares: number; widthInSquares: number;
    },
    apollo: NSeatsIterablePerArea,
    requestedHera: NSeatsPerArea,
    { packed }: Pick<Readonly<Options>, "packed">,
): null | Fitness {
    if (heightInSquares < crossRows) {
        return null;
    }
    if (widthInSquares < 1 + wingCols + (crossCols > 0 ? crossCols + 1 : 0)) {
        return null;
    }

    let oppositionNecessaryCols, governmentNecessaryCols, crossNecessaryRows;
    if (packed) {
        if (requestedHera.opposition > wingRows * wingCols) {
            return null;
        }
        if (requestedHera.government > wingRows * wingCols) {
            return null;
        }
        if (requestedHera.cross > crossRows * crossCols) {
            return null;
        }

        oppositionNecessaryCols = Math.ceil(requestedHera.opposition / wingRows);
        governmentNecessaryCols = Math.ceil(requestedHera.government / wingRows);
        crossNecessaryRows = Math.ceil(requestedHera.cross / crossCols);
    } else {
        oppositionNecessaryCols = reduceNotPacked(apollo.opposition.values(), wingRows);
        if (oppositionNecessaryCols > wingCols) {
            return null;
        }

        governmentNecessaryCols = reduceNotPacked(apollo.government.values(), wingRows);
        if (governmentNecessaryCols > wingCols) {
            return null;
        }

        crossNecessaryRows = reduceNotPacked(apollo.cross.values(), crossCols);
        if (crossNecessaryRows > crossRows) {
            return null;
        }
    }

    return {
        oppositionNecessaryCols,
        governmentNecessaryCols,
        crossNecessaryRows,
    };
}

/**
 * Given an area, and a number of rows, returns the number of columns that are required
 * to fit every party, under the rule where no column is shared by several parties.
 * (For the crossbenchers, cols and rows are of course reversed.)
 * @param nSeatss the number of seats for each party in the given area
 * @param otherDimension the number of seats in the other dimension (usually the number of rows)
 * @returns the number of seats in that direction (usually columns) necessary to fit everyone
 */
function reduceNotPacked(
    nSeatss: Iterable<number>,
    otherDimension: number,
): number {
    return Array.from(nSeatss,
        nSeats => Math.ceil(nSeats / otherDimension)
    ).reduce((a, b) => a + b, 0);
}

function arrangeCross(
    fit: Fitness,
    crossTotal: number,
    requestedCrossNCols: number,
    widthInSquares: number,
): RowCols {
    if (crossTotal === 0)
        return { nRows: 0, nCols: 0 };
    if (requestedCrossNCols > 0)
        return { nRows: fit.crossNecessaryRows, nCols: requestedCrossNCols };

    // take all the available room
    const nCols = widthInSquares - Math.max(fit.oppositionNecessaryCols, fit.governmentNecessaryCols) - 2 /* speaker and gap between wings and cross */;
    return { nRows: Math.ceil(crossTotal/nCols), nCols };
}
