/**
 * This module declares all attribution types there are,
 * and export functions to help convert or generate those.
 */

import { Area, areaRecord, AREAS } from "./common";
import { NSeatsPerPartyPerArea } from "./geometry";

type WithArea<T> = T & {
    readonly area: Area;
}
type WithNumber<T> = T & {
    readonly nSeats: number;
}
type LocatedWithNumber<T> = WithArea<WithNumber<T>>;

type LocalAttri0<Party> = ReadonlyMap<Party, number>;
type LocalAttri1<Party> = Iterable<readonly [Party, number]>;
type LocalAttri1Array<Party> = readonly (readonly [Party, number])[];
type LocalAttri2<Party> = readonly WithNumber<Party>[];
type Attri1<Party> = {readonly [area in Area]?: LocalAttri1<Party>};
type Attri2<Party> = {readonly [area in Area]?: LocalAttri2<Party>};
type Attri12<Party> = {readonly [area in Area]?: LocalAttri1<Party>|LocalAttri2<Party>};
type Attri3<Party> = Iterable<readonly [WithArea<Party>, number]>;
type Attri3Array<Party> = readonly (readonly [WithArea<Party>, number])[];
type Attri4<Party> = readonly LocatedWithNumber<Party>[];

export type AnyAttribution<Party> =
    | Attri1<Party>
    | Attri2<Party>
    // | Attri12<Party> // works but not advertised
    | Attri3<Party>
    | Attri4<Party>
;

function extractSeats<P>(party: WithNumber<P>): [P, number] {
    return [party, party.nSeats];
}

function localAttri1to0<Party>(attribution: LocalAttri1<Party>): LocalAttri0<Party> {
    return new Map(attribution);
}
function localAttri2to0<Party>(attribution: LocalAttri2<Party>): LocalAttri0<Party> {
    return new Map(attribution.map(extractSeats));
}

function attri12ToNSeatsPerPartyPerArea<Party>(attribution: Attri12<Party>): NSeatsPerPartyPerArea<Party> {
    return areaRecord(area => {
        const entriesThisArea = attribution[area];
        if (!entriesThisArea) {
            return new Map();
        }
        const entriesAsArray: LocalAttri1Array<Party>|LocalAttri2<Party> = Array.isArray(entriesThisArea) ?
            entriesThisArea :
            [...entriesThisArea];
        if (entriesAsArray.length === 0) {
            return new Map();
        }
        const first = entriesAsArray[0]!;
        if (Array.isArray(first)) {
            // 1
            return localAttri1to0(entriesAsArray as LocalAttri1Array<Party>);
        } else {
            // 2
            return localAttri2to0(entriesAsArray as LocalAttri2<Party>);
        }
    });
}
function attri3ArrayToNSeatsPerPartyPerArea<Party>(attribution: Attri3Array<Party>): NSeatsPerPartyPerArea<Party> {
    return areaRecord(area => {
        return new Map((attribution.filter(([p,]) => p.area === area)));
    });
}
function attri4ToNSeatsPerPartyPerArea<Party>(attribution: Attri4<Party>): NSeatsPerPartyPerArea<Party> {
    return areaRecord(area => {
        return new Map(attribution.filter(p => p.area === area).map(extractSeats));
    });
}

export function anyAttributionToNSeatsPerPartyPerArea<Party>(attribution: AnyAttribution<Party>): NSeatsPerPartyPerArea<Party> {
    if (AREAS.some(area => area in attribution)) {
        // 1 or 2
        return attri12ToNSeatsPerPartyPerArea(attribution as Attri12<Party>);
    }
    // 3 or 4
    const attributionArray = [...(attribution as Attri3<Party>|Attri4<Party>)] as Attri3Array<Party>|Attri4<Party>;
    if (attributionArray.length === 0) {
        return areaRecord(() => new Map());
    }
    if (AREAS.some(area => area in attributionArray[0]!)) {
        // 4
        return attri4ToNSeatsPerPartyPerArea(attributionArray as Attri4<Party>);
    } else {
        // 3
        return attri3ArrayToNSeatsPerPartyPerArea(attributionArray as Attri3Array<Party>);
    }
}
