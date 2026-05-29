/**
 * This module exports what's needed for even the geometry phase.
 */

const WINGS = ["opposition", "government"] as const;
// type Wing = (typeof WINGS)[number];
export const AREAS = ["speak", ...WINGS, "cross"] as const;
export type Area = (typeof AREAS)[number];

export type CoordinatesPerParty<Party> = ReadonlyMap<Party, readonly (readonly [number, number])[]>;

/**
 * Rank-file indices for each seat for each party of each area.
 * The rank-file indices are relative to the top-left corner of the area.
 * The extremum values override the demeter parameters.
 */
export type CoordinatesPerPartyPerArea<Party> = {
    readonly [a in Area]: CoordinatesPerParty<Party>;
};

export interface RowCols {
    readonly nRows: number;
    readonly nCols: number;
}

export type AllocatedSeats<Party> = RowCols & CoordinatesPerParty<Party>;

export type AllocatedSeatsPerArea<Party> = {
    readonly [a in Area]: AllocatedSeats<Party>;
}

function newRecord<K extends string, V>(
    keys: readonly K[],
    valueGenerator: (key: K) => V,
) {
    return Object.fromEntries(keys.map(k => [k, valueGenerator(k)])) as { [k in K]: V; };
}

export function areaRecord<V>(
    valueGenerator: (key: Area) => V,
) {
    return newRecord(AREAS, valueGenerator);
}
