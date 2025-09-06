export const wings = ["opposition", "government"] as const;
export type Wing = (typeof wings)[number];
export const areas = ["speak", ...wings, "cross"] as const;
export type Area = (typeof areas)[number];

/**
 * Rank-file indices for each seat for each party of each area.
 * The rank-file indices are relative to the top-left corner of the area.
 * The extremum values override the demeter parameters.
 */
export type Poseidon<Party> = Record<Area, Map<Party, [number, number][]>>;
