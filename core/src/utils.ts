type WithNumber<T> = T & { readonly nSeats?: number|undefined };

/**
 * Typically Seats is a tuple of x/y coordinates, and SeatData gives infos on what seats should look like.
 * Typically the groups are ordered from the left to the right, and the seats are ordered from left to right.
 * If too few or too many seats are provided, an error is thrown.
 * @param attribution a mapping of groups associating the groups in a given order to the number of seats each group holds
 * @param seats an iterable of seats in a given order, its length should be the sum of the values in attribution
 * @returns a mapping of each group to the seats it holds
 */
export function dispatchSeats<SeatData, Seat>(
    attribution: Map<SeatData, number> | readonly WithNumber<SeatData>[],
    seats: Iterable<Seat>,
): Map<SeatData, Seat[]> {
    const seatIterator = seats[Symbol.iterator]();
    const entries: [SeatData, number][] = attribution instanceof Map ?
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
