import { Area, areas } from "./common";

interface Party {
    color: string;
    id?: string|undefined;
    data?: string|undefined;

    borderSize?: number|undefined;
    borderColor?: string|undefined;
    roundingRadius?: number|undefined;
}
interface PartyLocated extends Party {
    area: Area;
}
interface PartyWithNumber extends Party {
    nSeats: number;
}
type PartyLocatedWithNumber = PartyLocated & PartyWithNumber;


type PreApollo = readonly PartyLocatedWithNumber[];
/**
 * Number of seats for each party for each area.
 */
type Apollo = Record<Area, Map<Party, number>>;

/**
 * Number of occupied seats for each area.
 */
type Hera = Record<Area, number>;

/**
 * Number of rows and columns for each area.
 */
type Demeter = Record<Area, { nRows: number; nCols: number }>;

/**
 * Rank-file indices for each seat for each party of each area.
 */
type Poseidon = Record<Area, Map<Party, [number, number][]>>;


interface Options {
    /**
     * A requested number of rows for each of the two wings.
     * Ignored if 0, invalid (and ignored) if negative.
     */
    requestedWingNRows: number; // default 0

    /**
     * A requested number of columns for the crossbenchers.
     * Ignored if 0, invalid (and ignored) if negative.
     * Also called centerCols.
     */
    requestedCrossNCols: number; // default 0

    /**
     * Whether parties of the same wing are allowed to share the same column,
     * or the same row for crossbenchers.
     */
    cozy: boolean; // default true

    /**
     * Whether to prioritize having equal columns between the two wings,
     * over having equal rows.
     */
    fullWidth: boolean; // default false

    /**
     * The default value for the rounding radius of the corners of the squares,
     * unless overridden for a specific party.
     */
    roundingRadius: number; // default 0

    /**
     * The relative spacing between neighboring squares of the same area.
     * This is to be multiplied by the side of a square to get the actual spacing.
     */
    spacingFactor: number; // default .1
}
function defaultOptions({
    requestedWingNRows = 0,
    requestedCrossNCols = 0,
    cozy = true,
    fullWidth = false,
    roundingRadius = 0,
    spacingFactor = .1,
}: Partial<Options> = {}): Options {
    return {
        requestedWingNRows,
        requestedCrossNCols,
        cozy,
        fullWidth,
        roundingRadius,
        spacingFactor,
    };
}


/*
Disposition and rules:
The opposition is at the top of the diagram, the government at the bottom.
The speaker is at the left of the diagram, vertically centered between the two wings.
The crossbenchers are at the right of the diagram, vertically centered between the two wings.

The vertical gap between the two wings is equal to twice the side of a square.
The horizontal gap between the right side of the speaker and the left side of the wings is 0.
The horizontal gap between the right side of the rightmost wing and the left side of the crossbenchers is equal to the side of a square.
If there is no speaker, or no crossbenchers, there is no gap to the corresponding side of the wings.

The wings generally do not have the same number of vertical columns.
They have equal horizontal rows in priority.
The speakers are in a single column.
The number of rows and columns of the various areas are optimized so that all the squares fit in a 2:1 rectangle.
*/


export function enter(preApollo: PreApollo, options: Partial<Options> = {}) {
    const {
        requestedWingNRows,
        requestedCrossNCols,
        cozy,
        fullWidth,
        roundingRadius,
        spacingFactor,
    } = defaultOptions(options);

    const apollo = makeApollo(preApollo);
    const demeter = makeDemeter(apollo, { requestedWingNRows, requestedCrossNCols, cozy, fullWidth });
    // const poseidon = makePoseidon(demeter);
}

function newRecord<K extends string, V>(
    keys: readonly K[],
    valueGenerator: (key: K) => V,
): Record<K, V> {
    return Object.fromEntries(keys.map(k => [k, valueGenerator(k)])) as Record<K, V>;
}

function makeApollo(preApollo: PreApollo): Apollo {
    const apollo: Apollo = newRecord(areas, () => new Map());
    for (const party of preApollo) {
        apollo[party.area].set(party, party.nSeats);
    }
    return apollo;
}

function makeRequestedHera(apollo: Apollo): Hera {
    return newRecord(areas, area => {
        let nSeats = 0;
        for (const n of apollo[area].values()) {
            nSeats += n;
        }
        return nSeats;
    });
}

/*
inputs:
nOpposition: number of opposition seats
nGovernment: number of government seats
nCrossbenchers: number of crossbencher seats
nSpeaker: number of speaker seats

outputs:
wingRows: number of rows for each wing
wingCols: number of columns for each wing
crossCols: number of columns for the crossbenchers
crossRows: number of rows for the crossbenchers

constraints:
nOpposition <= wingRows * wingCols
nGovernment <= wingRows * wingCols
nCrossbenchers <= crossRows * crossCols
crossRows <= wingRows * 2 + 2
nSpeaker <= wingRows * 2 + 2
*/
function makeDemeter(
    apollo: Apollo,
    {}: Pick<Options, "requestedWingNRows"|"requestedCrossNCols"|"cozy"|"fullWidth">,
): Demeter {
    const requestedHera = makeRequestedHera(apollo);
    const sanityCheck = requestedHera.speak + requestedHera.opposition + requestedHera.government + requestedHera.cross;
    if (!Number.isSafeInteger(sanityCheck)) {
        throw new Error("Invalid number(s) of seats");
    }

    for (let heightInSquares = Math.max(4, requestedHera.speak);
         heightInSquares < 4*sanityCheck;
         heightInSquares++) {
        let crossRows: number,
            crossCols: number,
            wingRows: number,
            wingCols: number;

        wingRows = Math.trunc(heightInSquares/2 - 2);
        wingCols = 2*heightInSquares - 1; // 1 for the speaker
        if (requestedHera.cross > 0) {
            crossCols = Math.ceil(requestedHera.cross / heightInSquares);
            crossRows = Math.ceil(requestedHera.cross / crossCols);
            wingCols -= crossCols + 1; // 1 for the gap between wings and crossbenchers
        } else {
            crossRows = 0;
            crossCols = 0;
        }

        if (doesItFit(requestedHera, { wingRows, wingCols, crossRows, crossCols, heightInSquares, }, {})) {
            return {
                speak: { nRows: requestedHera.speak, nCols: 1 },
                opposition: { nRows: wingRows, nCols: wingCols },
                government: { nRows: wingRows, nCols: wingCols },
                cross: { nRows: crossRows, nCols: crossCols },
            };
        }
    }

    throw new Error("An error occurred");
}

function doesItFit(
    requestedHera: Hera,
    {
        wingRows, wingCols, crossRows, crossCols, heightInSquares,
    }: {
        wingRows: number; wingCols: number; crossRows: number; crossCols: number; heightInSquares: number;
    },
    {}: Pick<Options, never>,
): boolean {
    if (heightInSquares < requestedHera.speak
     || heightInSquares < crossRows
     || heightInSquares < 2*wingRows + 2) {
        return false;
    }
    if ((2 * heightInSquares) < 1 + wingCols + (crossCols > 0 ? crossCols + 1 : 0)) {
        return false;
    }

    if (requestedHera.opposition > wingRows * wingCols) {
        return false;
    }
    if (requestedHera.government > wingRows * wingCols) {
        return false;
    }
    if (requestedHera.cross > crossRows * crossCols) {
        return false;
    }
    if (requestedHera.speak > heightInSquares) {
        return false;
    }

    // TODO some other checks depending on options

    return true;
}
