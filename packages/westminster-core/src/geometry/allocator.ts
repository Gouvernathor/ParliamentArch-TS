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
        speak: getSpeakCoordinates<Party>(apollo.speak),
        opposition: getOppositionCoordinates<Party>(apollo.opposition, demeter.opposition.nRows, packed),
        government: getGovernmentCoordinates<Party>(apollo.government, demeter.government.nRows, packed),
        cross: getCrossbenchCoordinates<Party>(apollo.cross, demeter.cross.nCols, packed),
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

function getOppositionCoordinates<Party>(
    apolloOpposition: ReadonlyMap<Party, number>,
    nRows: number,
    packed: boolean,
): CoordinatesPerParty<Party> {
    const opposition = new Map<Party, [number, number][]>();
    let oppositionX = 0, oppositionY = nRows - 1;
    for (const [party, nSeats] of apolloOpposition) {
        opposition.set(party, Array.from({ length: nSeats }, () => {
            try {
                return [oppositionX, oppositionY--];
            } finally {
                if (oppositionY < 0) {
                    oppositionY = nRows - 1;
                    oppositionX++;
                }
            }
        }));
        if (!packed) {
            oppositionY = nRows - 1;
            oppositionX++;
        }
    }
    return opposition;
}

function getGovernmentCoordinates<Party>(
    apolloGovernment: ReadonlyMap<Party, number>,
    nRows: number,
    packed: boolean,
): CoordinatesPerParty<Party> {
    const government = new Map<Party, [number, number][]>();
    let governmentX = 0, governmentY = 0;
    for (const [party, nSeats] of apolloGovernment) {
        government.set(party, Array.from({ length: nSeats }, () => {
            try {
                return [governmentX, governmentY++];
            } finally {
                if (governmentY >= nRows) {
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
    apolloCross: ReadonlyMap<Party, number>,
    nCols: number,
    packed: boolean,
): CoordinatesPerParty<Party> {
    const cross = new Map<Party, [number, number][]>();
    let crossX = 0, crossY = 0;
    for (const [party, nSeats] of apolloCross) {
        cross.set(party, Array.from({ length: nSeats }, () => {
            try {
                return [crossX++, crossY];
            } finally {
                if (crossX >= nCols) {
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
