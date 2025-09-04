export const wings = ["left", "right"] as const;
export type Wing = (typeof wings)[number];
export const areas = ["head", ...wings, "center"] as const;
export type Area = (typeof areas)[number];
