export const wings = ["opposition", "government"] as const;
export type Wing = (typeof wings)[number];
export const areas = ["speak", ...wings, "cross"] as const;
export type Area = (typeof areas)[number];
