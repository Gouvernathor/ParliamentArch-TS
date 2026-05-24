import { Area, CoordinatesPerPartyPerArea, CoordinatesPerParty } from "../common";
import { Options } from "./common";
import { NRowsAndColsPerArea } from "./rows-cols";

/**
 * Number of seats for each party for each area.
 */
export type NSeatsPerPartyPerArea<Party> = { readonly [a in Area]: ReadonlyMap<Party, number> };

export function getCoordinates<Party>(
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
