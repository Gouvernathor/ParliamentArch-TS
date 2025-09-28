import { Area, AREAS, newRecord } from "./common";
import { Apollo } from "./geometry";
import { Party } from "./svg";

type TWithArea<T> = T & {
    area: Area;
}
type TWithNumber<T> = T & {
    nSeats: number;
}
type TLocatedWithNumber<T> = TWithArea<TWithNumber<T>>;

function apolloFromAnyAttribution(
    attribution:
        | Record<Area, readonly [Party, number][]>
        | Record<Area, readonly TWithNumber<Party>[]>
        | readonly TLocatedWithNumber<Party>[]
        | readonly [TWithArea<Party>, number][]
        | Apollo<Party>,
): Apollo<Party> {
    if (Object.keys(attribution).every(k => AREAS.includes(k as Area))) {
        return newRecord(AREAS, area => {
            type Iter = readonly (readonly [Party, number] | TWithNumber<Party>)[];
            const entriesThisArea = (attribution as any)[area] as Iter;
            if (entriesThisArea.length === 0) {
                return new Map();
            }
            if (Array.isArray(entriesThisArea[0])) {
                return new Map(entriesThisArea as readonly [Party, number][]);
            }
            return new Map((entriesThisArea as readonly TWithNumber<Party>[])
                .map(p => [p, p.nSeats] as const));
        });
    } else if (Array.isArray(attribution)) {
        // pre-apollo or array of [partyWithArea, nSeats]
        // if not pre-apollo, convert to pre-apollo :
        let preApollo: readonly [TWithArea<Party>, number][];
        if (attribution.every(p => "area" in p)) {
            preApollo = (attribution as readonly TLocatedWithNumber<Party>[])
                .map(p => [p, p.nSeats] as const);
        } else {
            preApollo = attribution as readonly [TWithArea<Party>, number][];
        }
        return newRecord(AREAS, (area) =>
            new Map(preApollo.filter(([p]) => p.area === area)));
    } else {
        return attribution as Apollo<Party>;
    }
}

export function getSVGFromAttribution() {}
