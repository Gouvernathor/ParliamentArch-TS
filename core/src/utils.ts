type WithNumber<T> = T & { readonly nSeats?: number|undefined };

const isReadonlyMap: (v: any) => v is ReadonlyMap<any, any> = v => v instanceof Map;

/**
 * Typically Seats is a tuple of x/y coordinates, and SeatData gives infos on what seats should look like.
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
type MappedSeatCenters<SeatDisplay> = Iterable<readonly [SeatCenter, SeatDisplay]>;
type GroupedSeatCenters<SeatDisplay> = Iterable<readonly [SeatDisplay, readonly SeatCenter[]]>;

/**
 * Util function to convert seat centers representation
 * @param seatCenters seating data oriented by seat center
 * @returns grouped seat centers, organized by display, as taken by the component's input
 */
export function regroupSeatCenters<SeatDisplay>(
    seatCenters: MappedSeatCenters<SeatDisplay>,
): GroupedSeatCenters<SeatDisplay> {
    const seatCentersByGroup = new Map<SeatDisplay, SeatCenter[]>();
    for (const [seat, group] of seatCenters) {
        if (!seatCentersByGroup.has(group)) {
            seatCentersByGroup.set(group, []);
        }
        seatCentersByGroup.get(group)!.push(seat);
    }
    return seatCentersByGroup;
}
