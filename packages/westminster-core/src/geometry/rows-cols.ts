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
        let crossRows: number,
            crossCols: number,
            wingRows: number,
            wingCols: number;

        wingRows = requestedWingNRows || Math.trunc(heightInSquares/2 - 1);
        wingCols = widthInSquares - 1; // 1 for the speaker
        if (requestedHera.cross > 0) {
            crossCols = requestedCrossNCols || Math.ceil(requestedHera.cross / heightInSquares);
            crossRows = Math.ceil(requestedHera.cross / crossCols);
            wingCols -= crossCols + 1; // 1 for the gap between wings and crossbenchers
        } else {
            crossRows = 0;
            crossCols = 0;
        }

        if (howDoesItFit({ wingRows, wingCols, crossRows, crossCols, heightInSquares, widthInSquares }, ares, requestedHera, { packed })) {
            return {
                speak: { nRows: requestedHera.speak, nCols: 1 },
                opposition: { nRows: wingRows, nCols: wingCols },
                government: { nRows: wingRows, nCols: wingCols },
                cross: { nRows: crossRows, nCols: crossCols },
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

interface Fitness {}

function howDoesItFit(
    {
        wingRows, wingCols, crossRows, crossCols, heightInSquares, widthInSquares
    }: {
        wingRows: number; wingCols: number; crossRows: number; crossCols: number; heightInSquares: number; widthInSquares: number;
    },
    apollo: NSeatsIterablePerArea,
    requestedHera: NSeatsPerArea,
    { packed }: Pick<Readonly<Options>, "packed">,
): null | Fitness {
    if (heightInSquares < requestedHera.speak
     || heightInSquares < crossRows
     || heightInSquares < 2*wingRows + 2) {
        return null;
    }
    if (widthInSquares < 1 + wingCols + (crossCols > 0 ? crossCols + 1 : 0)) {
        return null;
    }

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
    } else {
        const oppositionNecessaryCols = reduceNotPacked(apollo.opposition.values(), wingRows);
        if (oppositionNecessaryCols > wingCols) {
            return null;
        }

        const governmentNecessaryCols = reduceNotPacked(apollo.government.values(), wingRows);
        if (governmentNecessaryCols > wingCols) {
            return null;
        }

        const crossNecessaryRows = reduceNotPacked(apollo.cross.values(), crossCols);
        if (crossNecessaryRows > crossRows) {
            return null;
        }
    }

    return true;
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
