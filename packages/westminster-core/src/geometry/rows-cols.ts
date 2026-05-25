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
 * Caveat : both wings will be declared as having the size of the bigger of the two.
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

        // if it's too much, even without cross, then bail
        if (widthInSquares < minWingCols+1) continue;

        let proposedCrossRowCols: RowCols;
        if (requestedHera.cross === 0) {
            proposedCrossRowCols = { nRows: 0, nCols: 0 };
            // x fitness check already made
        } else {
            let crossCols;
            if (requestedCrossNCols > 0) {
                if (widthInSquares < 1/* speaker */ +minWingCols +1/* gap between wings and cross */ +requestedCrossNCols) continue;
                crossCols = requestedCrossNCols;
            } else {
                crossCols = widthInSquares -1/* speaker */ -minWingCols -1/* gap between wings and cross */;
                if (crossCols < 1) continue;
            }

            const crossRows = packed ?
                Math.ceil(requestedHera.cross / crossCols) :
                reduceNotPacked(ares.cross.values(), crossCols);
            if (heightInSquares < crossRows) continue;

            proposedCrossRowCols = {
                nRows: crossRows,
                nCols: crossCols,
            };
        }
        const proposedWingRowCols = {
            nRows: maxWingRows,
            nCols: minWingCols,
        };

        if (!doesItFit(proposedWingRowCols, proposedCrossRowCols, ares, requestedHera, { packed })) continue;

        return {
            speak: { nRows: requestedHera.speak, nCols: 1 },

            // known limitation : the shorter wing will be declared at the size of the larger wing
            opposition: proposedWingRowCols,
            government: proposedWingRowCols,

            cross: proposedCrossRowCols,
        };
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

function doesItFit(
    { nRows: wingRows, nCols: wingCols }: RowCols,
    { nRows: crossRows, nCols: crossCols }: RowCols,
    apollo: NSeatsIterablePerArea,
    requestedHera: NSeatsPerArea,
    { packed }: Pick<Readonly<Options>, "packed">,
): boolean {
    if (packed) {
        if (requestedHera.opposition > wingRows * wingCols) {
            return false;
        }
        if (requestedHera.government > wingRows * wingCols) {
            return false;
        }
        if (requestedHera.cross > crossRows * crossCols) {
            return false;
        }
    } else {
        const oppositionNecessaryCols = reduceNotPacked(apollo.opposition.values(), wingRows);
        if (oppositionNecessaryCols > wingCols) {
            return false;
        }

        const governmentNecessaryCols = reduceNotPacked(apollo.government.values(), wingRows);
        if (governmentNecessaryCols > wingCols) {
            return false;
        }

        const crossNecessaryRows = reduceNotPacked(apollo.cross.values(), crossCols);
        if (crossNecessaryRows > crossRows) {
            return false;
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
