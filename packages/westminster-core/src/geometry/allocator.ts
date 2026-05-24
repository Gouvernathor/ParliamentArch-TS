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
        opposition: getWingCoordinates<Party>(
            apollo.opposition, demeter.opposition.nRows, packed,
            (x, y) => [x, demeter.opposition.nRows-1 - y],
        ),
        government: getWingCoordinates<Party>(
            apollo.government, demeter.government.nRows, packed,
        ),
        cross: getWingCoordinates<Party>(
            apollo.cross, demeter.cross.nCols, packed,
            (x, y) => [y, x],
        ),
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
