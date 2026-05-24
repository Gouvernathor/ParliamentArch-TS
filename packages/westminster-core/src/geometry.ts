import { Area, CoordinatesPerParty, CoordinatesPerPartyPerArea } from "./common.js";
import { defaultOptions, Options } from "./geometry/common.js";
import { getNumberOfRowsAndColsPerArea, NRowsAndColsPerArea } from "./geometry/rows-cols.js";

// TODO move/rename as geometry/index.ts and update package.json

export {
    Options as GetSeatCoordinatesPerAreaOptions,
    getNumberOfRowsAndColsPerArea,
};

/**
 * Number of seats for each party for each area.
 */
export type NSeatsPerPartyPerArea<Party> = { readonly [a in Area]: ReadonlyMap<Party, number> };

/*
Disposition and rules:
The opposition is at the top of the diagram, the government at the bottom.
The speaker is at the left of the diagram, vertically centered between the two wings.
The crossbenchers are at the right of the diagram, vertically centered between the two wings.

The vertical gap between the two wings is equal to twice the side of a square.
The horizontal gap between the right side of the speaker and the left side of the wings is 0.
The horizontal gap between the right side of the rightmost wing and the left side of the crossbenchers is equal to the side of a square.
If there is no speaker, or no crossbenchers, there is no gap to the corresponding side of the wings.

The wings generally do not have the same number of vertical columns.
They have equal horizontal rows in priority.
The speakers are in a single column.
The number of rows and columns of the various areas are optimized so that all the squares fit in a 2:1 rectangle.
*/

/*
inputs:
nOpposition: number of opposition seats
nGovernment: number of government seats
nCrossbenchers: number of crossbencher seats
nSpeaker: number of speaker seats

outputs:
wingRows: number of rows for each wing
wingCols: number of columns for each wing
crossCols: number of columns for the crossbenchers
crossRows: number of rows for the crossbenchers

constraints:
nOpposition <= wingRows * wingCols
nGovernment <= wingRows * wingCols
nCrossbenchers <= crossRows * crossCols
crossRows <= wingRows * 2 + 2
nSpeaker <= wingRows * 2 + 2
*/

export function getSeatCoordinatesPerArea<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
    options: Partial<Readonly<Options>> = {},
): CoordinatesPerPartyPerArea<Party> {
    const {
        wingNRows,
        crossNCols,
        packed,
        // fullWidth,
    } = defaultOptions(options);

    const demeter = getNumberOfRowsAndColsPerArea(apollo, { wingNRows, crossNCols, packed, /*fullWidth*/ });
    return getCoordinates(apollo, demeter, { packed });
}

function getCoordinates<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
    demeter: NRowsAndColsPerArea,
    { packed }: Pick<Readonly<Options>, "packed">,
): CoordinatesPerPartyPerArea<Party> {
    return {
        speak: getSpeakCoordinates<Party>(apollo),
        opposition: getOppositionCoordinates<Party>(apollo, demeter, packed),
        government: getGovernmentCoordinates<Party>(apollo, demeter, packed),
        cross: getCrossbenchCoordinates<Party>(apollo, demeter, packed),
    };
}

function getSpeakCoordinates<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
): CoordinatesPerParty<Party> {
    const speak = new Map<Party, [number, number][]>();
    let speakY = 0;
    for (const [party, nSeats] of apollo.speak) {
        speak.set(party, Array.from({ length: nSeats }, () => [0, speakY++]));
    }
    return speak;
}

function getOppositionCoordinates<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
    demeter: NRowsAndColsPerArea,
    packed: boolean,
): CoordinatesPerParty<Party> {
    const opposition = new Map<Party, [number, number][]>();
    let oppositionX = 0, oppositionY = demeter.opposition.nRows - 1;
    for (const [party, nSeats] of apollo.opposition) {
        opposition.set(party, Array.from({ length: nSeats }, () => {
            try {
                return [oppositionX, oppositionY--];
            } finally {
                if (oppositionY < 0) {
                    oppositionY = demeter.opposition.nRows - 1;
                    oppositionX++;
                }
            }
        }));
        if (!packed) {
            oppositionY = demeter.opposition.nRows - 1;
            oppositionX++;
        }
    }
    return opposition;
}

function getGovernmentCoordinates<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
    demeter: NRowsAndColsPerArea,
    packed: boolean,
): CoordinatesPerParty<Party> {
    const government = new Map<Party, [number, number][]>();
    let governmentX = 0, governmentY = 0;
    for (const [party, nSeats] of apollo.government) {
        government.set(party, Array.from({ length: nSeats }, () => {
            try {
                return [governmentX, governmentY++];
            } finally {
                if (governmentY >= demeter.government.nRows) {
                    governmentY = 0;
                    governmentX++;
                }
            }
        }));
        if (!packed) {
            governmentY = 0;
            governmentX++;
        }
    }
    return government;
}

function getCrossbenchCoordinates<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
    demeter: NRowsAndColsPerArea,
    packed: boolean,
): CoordinatesPerParty<Party> {
    const cross = new Map<Party, [number, number][]>();
    let crossX = 0, crossY = 0;
    for (const [party, nSeats] of apollo.cross) {
        cross.set(party, Array.from({ length: nSeats }, () => {
            try {
                return [crossX++, crossY];
            } finally {
                if (crossX >= demeter.cross.nCols) {
                    crossX = 0;
                    crossY++;
                }
            }
        }));
        if (!packed) {
            crossX = 0;
            crossY++;
        }
    }
    return cross;
}
