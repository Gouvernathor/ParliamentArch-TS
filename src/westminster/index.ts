import { Area, AREAS, newRecord } from "./common.js";
import { NSeatsPerPartyPerArea, getSeatCoordinatesPerArea, Options as GeometryOptions } from "./geometry.js";
import { buildSVG, Options as SVGOptions, Party } from "./svg.js";

export { Party };

type TWithArea<T> = T & {
    area: Area;
}
type TWithNumber<T> = T & {
    nSeats: number;
}
type TLocatedWithNumber<T> = TWithArea<TWithNumber<T>>;

type AnyAttribution =
    | Record<Area, readonly [Party, number][]>
    | Record<Area, readonly TWithNumber<Party>[]>
    | readonly TLocatedWithNumber<Party>[]
    | readonly [TWithArea<Party>, number][]
    | NSeatsPerPartyPerArea<Party>
;

function extractSeats<P extends Party>(party: TWithNumber<P>): [P, number] {
    return [party, party.nSeats];
}

function apolloFromAnyAttribution(
    attribution: AnyAttribution,
): NSeatsPerPartyPerArea<Party> {
    if (Object.keys(attribution).some(k => AREAS.includes(k as Area))) {
        return newRecord(AREAS, area => {
            type Iter = readonly (readonly [Party, number] | TWithNumber<Party>)[] | Map<Party, number>;
            const entriesThisArea = (attribution as any)[area] as Iter|undefined;
            if (entriesThisArea instanceof Map) {
                return entriesThisArea;
            }
            if (!entriesThisArea || entriesThisArea.length === 0) {
                return new Map();
            }
            if (Array.isArray(entriesThisArea[0])) {
                return new Map(entriesThisArea as readonly [Party, number][]);
            }
            return new Map((entriesThisArea as readonly TWithNumber<Party>[])
                .map(extractSeats));
        });
    } else if (Array.isArray(attribution)) {
        // pre-apollo or array of [partyWithArea, nSeats]
        // if not pre-apollo, convert to pre-apollo :
        let preApollo: readonly [TWithArea<Party>, number][];
        if (attribution.every(p => "area" in p)) {
            preApollo = (attribution as readonly TLocatedWithNumber<Party>[])
                .map(extractSeats);
        } else {
            preApollo = attribution as readonly [TWithArea<Party>, number][];
        }
        return newRecord(AREAS, (area) =>
            new Map(preApollo.filter(([p]) => p.area === area)));
    } else {
        throw new Error("Invalid attribution format");
    }
}

interface Options extends GeometryOptions, SVGOptions {}

export function getSVGFromAttribution(
    attribution: AnyAttribution,
    options: Partial<Options> = {},
): SVGSVGElement {
    return buildSVG(getSeatCoordinatesPerArea(apolloFromAnyAttribution(attribution), options), options);
}
