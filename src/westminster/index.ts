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

type LocalAttri0 = ReadonlyMap<Party, number>;
type LocalAttri1 = Iterable<readonly [Party, number]>;
type LocalAttri2 = readonly TWithNumber<Party>[];
type Attri1 = {readonly [area in Area]?: LocalAttri1};
type Attri2 = {readonly [area in Area]?: LocalAttri2};
type Attri12 = {readonly [area in Area]?: LocalAttri1|LocalAttri2};
type Attri3 = Iterable<readonly [TWithArea<Party>, number]>;
type Attri3Array = readonly (readonly [TWithArea<Party>, number])[];
type Attri4 = readonly TLocatedWithNumber<Party>[];

type AnyAttribution =
    | Attri1
    | Attri2
    // | Attri12 // works but not advertised
    | Attri3
    | Attri4
;

function extractSeats<P extends Party>(party: TWithNumber<P>): [P, number] {
    return [party, party.nSeats];
}

function localAttri1to0(attribution: LocalAttri1): LocalAttri0 {
    return new Map(attribution);
}
function localAttri2to0(attribution: LocalAttri2): LocalAttri0 {
    return new Map(attribution.map(extractSeats));
}

function attri12ToNSeatsPerPartyPerArea(attribution: Attri12): NSeatsPerPartyPerArea<Party> {
    return newRecord(AREAS, area => {
        const entriesThisArea = attribution[area];
        if (!entriesThisArea || (Array.isArray(entriesThisArea) && entriesThisArea.length === 0)) {
            return new Map();
        }
        if (Array.isArray(entriesThisArea)) {
            return localAttri2to0(entriesThisArea as LocalAttri2);
        }
        return localAttri1to0(entriesThisArea as LocalAttri1);
    });
}
function attri3ArrayToNSeatsPerPartyPerArea(attribution: Attri3Array): NSeatsPerPartyPerArea<Party> {
    return newRecord(AREAS, area => {
        return new Map((attribution.filter(([p,]) => p.area === area)));
    });
}
function attri4ToNSeatsPerPartyPerArea(attribution: Attri4): NSeatsPerPartyPerArea<Party> {
    return newRecord(AREAS, area => {
        return new Map(attribution.filter(p => p.area === area).map(extractSeats));
    });
}

function anyAttributionToNSeatsPerPartyPerArea(
    attribution: AnyAttribution,
): NSeatsPerPartyPerArea<Party> {
    if (AREAS.some(area => area in attribution)) {
        // 1 or 2
        return attri12ToNSeatsPerPartyPerArea(attribution as Attri12);
    }
    // 3 or 4
    const attributionArray = [...(attribution as Attri3|Attri4)] as Attri3Array|Attri4;
    if (attributionArray.length === 0) {
        return newRecord(AREAS, () => new Map());
    }
    if (AREAS.some(area => area in attributionArray[0]!)) {
        // 4
        return attri4ToNSeatsPerPartyPerArea(attributionArray as Attri4);
    } else {
        // 3
        return attri3ArrayToNSeatsPerPartyPerArea(attributionArray as Attri3Array);
    }
}

interface Options extends GeometryOptions, SVGOptions {}

export function getSVGFromAttribution(
    attribution: AnyAttribution,
    options: Partial<Options> = {},
): SVGSVGElement {
    return buildSVG(getSeatCoordinatesPerArea(anyAttributionToNSeatsPerPartyPerArea(attribution), options), options);
}
