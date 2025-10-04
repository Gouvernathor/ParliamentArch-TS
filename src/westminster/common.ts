export const WINGS = ["opposition", "government"] as const;
export type Wing = (typeof WINGS)[number];
export const AREAS = ["speak", ...WINGS, "cross"] as const;
export type Area = (typeof AREAS)[number];

/**
 * Rank-file indices for each seat for each party of each area.
 * The rank-file indices are relative to the top-left corner of the area.
 * The extremum values override the demeter parameters.
 */
export type CoordinatesPerPartyPerArea<Party> = Record<Area, Map<Party, [number, number][]>>;

export function newRecord<K extends string, V>(
    keys: readonly K[],
    valueGenerator: (key: K) => V,
) {
    return Object.fromEntries(keys.map(k => [k, valueGenerator(k)])) as { [k in K]: V; };
}
