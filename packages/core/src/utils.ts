import { getNRowsFromNSeats, getRowThickness, getSeatCenters, GetSeatCentersOptions } from "./geometry.js";

type WithNumber<T> = T & { readonly nSeats?: number|undefined };

const isReadonlyMap: (v: any) => v is ReadonlyMap<any, any> = v => v instanceof Map;

/**
 * Typically SeatLocation is a tuple of x/y coordinates, and SeatDisplay gives infos on what seats should look like.
 * Typically the groups are ordered from the left to the right, and the seats are ordered from left to right.
 * If too few or too many seats are provided, an error is thrown.
 * @param attribution a mapping of groups associating the groups in a given order to the number of seats each group holds
 * @param seats an iterable of seats in a given order, its length should be the sum of the values in attribution
 * @returns a mapping of each group to the seats it holds
 */
export function dispatchSeats<SeatDisplay, SeatLocation>(
    attribution: ReadonlyMap<SeatDisplay, number> | readonly WithNumber<SeatDisplay>[],
    seats: Iterable<SeatLocation>,
): Map<SeatDisplay, SeatLocation[]> {
    const seatIterator = seats[Symbol.iterator]();
    const entries: [SeatDisplay, number][] = isReadonlyMap(attribution) ?
        Array.from(attribution) :
        attribution.map(seatData => [seatData, seatData.nSeats ?? 1]);

    try {
        return new Map(entries.map(([group, nSeats]) =>
            [group, Array.from({ length: nSeats }, () => {
                const seatIteration = seatIterator.next();
                if (seatIteration.done) {
                    throw new Error("Not enough seats");
                }
                return seatIteration.value;
            })]
        ));
    } finally {
        if (!seatIterator.next().done) {
            throw new Error("Too many seats");
        }
    }
}

type SeatCenter = readonly [number, number];
type MappedSeatCenters<SeatDisplay, SeatLocation> = Iterable<readonly [SeatLocation, SeatDisplay]>;
type GroupedSeatCenters<SeatDisplay, SeatLocation> = Iterable<readonly [SeatDisplay, readonly SeatLocation[]]>;

/**
 * Util function to convert seat centers representation
 * @param seatCenters seating data oriented by seat center
 * @returns grouped seat centers, organized by display, as taken by the component's input
 */
export function regroupSeatCenters<SeatDisplay, SeatLocation=SeatCenter>(
    seatCenters: MappedSeatCenters<SeatDisplay, SeatLocation>,
): GroupedSeatCenters<SeatDisplay, SeatLocation> {
    const seatCentersByGroup = new Map<SeatDisplay, SeatLocation[]>();
    for (const [seat, group] of seatCenters) {
        if (!seatCentersByGroup.has(group)) {
            seatCentersByGroup.set(group, []);
        }
        seatCentersByGroup.get(group)!.push(seat);
    }
    return seatCentersByGroup;
}


export interface PrecomputeOptions extends GetSeatCentersOptions {
    seatRadiusFactor: number;
}
export interface PrecomputeReturn<SeatDisplay> {
    groupedSeatCenters: Map<SeatDisplay, SeatCenter[]>,
    seatActualRadius: number,
}

/**
 * Pre-computes some values that are useful in the extensions that generate actual diagrams.
 * The SeatDisplay type will depend on the extension.
 * @param options.seatRadiusFactor the ratio (between 0 and 1) of the seat radius over the row thickness. Defaults to .8.
 * @param options the rest of the options are those passed through to the options parameter of the getSeatCenters function.
 * @returns an object with two properties:
 * the groupedSeatCenters key, a mapping of SeatDisplay objects to the list of the corresponding seats' coordinates,
 * and the seatActualRadius key, the actual radius of the seats (in the same unit as the coordinates)
 */
export function precomputeFromAttribution<SeatDisplay>(
    attribution: ReadonlyMap<SeatDisplay, number> | readonly WithNumber<SeatDisplay>[],
    options: Partial<Readonly<PrecomputeOptions>> = {},
): PrecomputeReturn<SeatDisplay> {
    if (!isReadonlyMap(attribution)) {
        attribution = new Map(attribution.map(seatData => [seatData, seatData.nSeats ?? 1]));
    }

    const seatRadiusFactor = options.seatRadiusFactor ?? .8;

    const nSeats = [...attribution.values()].reduce((a, b) => a + b, 0);

    const results = getSeatCenters(nSeats, options);
    const groupedSeatCenters = dispatchSeats(attribution, [...results.keys()].sort((a, b) => results.get(b)! - results.get(a)!));
    const seatActualRadius = seatRadiusFactor * getRowThickness(getNRowsFromNSeats(nSeats, options.spanAngle));
    return {
        groupedSeatCenters,
        seatActualRadius,
    };
}
