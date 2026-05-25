import { Area, AllocatedSeatsPerArea, CoordinatesPerParty, RowCols } from "../common";
import { Options } from "./common";
import { NRowsAndColsPerArea } from "./rows-cols";

/**
 * Number of seats for each party for each area.
 */
export type NSeatsPerPartyPerArea<Party> = {
    readonly [a in Area]: ReadonlyMap<Party, number>;
};

export function getAllocatedSeatsPerArea<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
    demeter: NRowsAndColsPerArea,
    { packed }: Pick<Readonly<Options>, "packed">,
): AllocatedSeatsPerArea<Party> {
    return {
        speak: Object.assign(getSpeakCoordinates<Party>(apollo.speak), demeter.speak),

        opposition: Object.assign(getWingCoordinates<Party>(
            apollo.opposition, demeter.opposition.nRows, packed,
            (x, y) => [x, demeter.opposition.nRows-1 - y],
        ), demeter.opposition),

        government: Object.assign(getWingCoordinates<Party>(
            apollo.government, demeter.government.nRows, packed,
        ), demeter.government),

        cross: Object.assign(getWingCoordinates<Party>(
            apollo.cross, demeter.cross.nCols, packed,
            (x, y) => [y, x],
        ), demeter.cross),
    };
}

function getSpeakCoordinates<Party>(
    apolloSpeak: ReadonlyMap<Party, number>,
): CoordinatesPerParty<Party> {
    const speak = new Map<Party, [number, number][]>();
    let speakY = 0;
    for (const [party, nSeats] of apolloSpeak) {
        speak.set(party, Array.from({ length: nSeats }, () => [0, speakY++]));
    }
    return speak;
}

function getWingCoordinates<Party>(
    attribution: ReadonlyMap<Party, number>,
    nRows: number,
    packed: boolean,
    map = (a: number, b: number) => [a, b] as const,
): CoordinatesPerParty<Party> {
    const coordinates = new Map<Party, readonly (readonly [number, number])[]>();
    let x = 0, y = 0;
    for (const [party, nSeats] of attribution) {
        coordinates.set(party, Array.from({ length: nSeats }, () => {
            try {
                return map(x, y++);
            } finally {
                if (y >= nRows) {
                    y = 0;
                    x++;
                }
            }
        }));
        if (!packed) {
            y = 0;
            x++;
        }
    }
    return coordinates;
}

// How it works vanilla, with the variables and parameters renamed
// @ts-expect-error
function getCrossCoordinates<Party>(
    attribution: ReadonlyMap<Party, number>,
    nCols: number,
    packed: boolean,
): CoordinatesPerParty<Party> {
    const coordinates = new Map<Party, readonly (readonly [number, number])[]>();
    let x = 0, y = 0;
    for (const [party, nSeats] of attribution) {
        coordinates.set(party, Array.from({ length: nSeats }, () => {
            try {
                return [x++, y];
            } finally {
                if (x >= nCols) {
                    x = 0;
                    y++;
                }
            }
        }));
        if (!packed) {
            x = 0;
            y++;
        }
    }
    return coordinates;
}

// @ts-expect-error
function getPackedCrossCoordinates<Party>(
    attribution: ReadonlyMap<Party, number>,
    rowCols: RowCols,
): CoordinatesPerParty<Party> {
    const seatsInLastColumn = rowCols.nRows % rowCols.nCols; // 0 is a special case, but ignored
    const seatsMissingInLastColumn = rowCols.nRows - seatsInLastColumn;
    const incompleteColumnYOffset = seatsMissingInLastColumn/2;

    const totalNSeats = Array.from(attribution.values()).reduce((s, n) => s+n, 0);
    const floatNCols = totalNSeats / rowCols.nRows;
    /** The seats having this index as the column must get the offset (works if no seat should be offset) */
    const incompleteColumnIdx = Math.ceil(floatNCols + .5) -1/*because it starts at 0*/;

    let x = 0, y = 0;
    const seats = Array.from({ length: totalNSeats }, () => {
        try {
            return [x++, y === incompleteColumnIdx ? y+incompleteColumnYOffset : y] as const;
        } finally {
            if (x >= rowCols.nCols) {
                x = 0;
                y++;
            }
        }
    }).sort(([x1, y1], [x2, y2]) => y1-y2 || x1-x2);

    const coordinates = new Map<Party, readonly (readonly [number, number])[]>();
    for (const [party, nSeats] of attribution) {
        coordinates.set(party, seats.splice(0, nSeats));
    }
    return coordinates;
}

/*
packed-only version

generate the seats fist, the right amount
offset/center the last column vertically
then allocate the seats to the parties,
ordering the seats by top to bottom (with offsets applied), then left to right





version that's `packed` compliant

the number of seats with a given room stays the same (in packed and non-packed modes)

each party gets
*/
