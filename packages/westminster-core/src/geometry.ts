import { CoordinatesPerPartyPerArea } from "./common.js";
import { NSeatsPerPartyPerArea, getCoordinates } from "./geometry/allocator.js";
import { Options, defaultOptions } from "./geometry/common.js";
import { getRowsAndColsPerArea, NRowsAndColsPerArea, NSeatsIterablePerArea } from "./geometry/rows-cols.js";

export {
    Options as GeometryOptions,
    NSeatsIterablePerArea,
    NSeatsPerPartyPerArea,
};

// TODO move/rename as geometry/index.ts and update package.json

export function getNumberOfRowsAndColsPerArea(
    ares: NSeatsIterablePerArea,
    options: Partial<Readonly<Options>>,
): NRowsAndColsPerArea {
    return getRowsAndColsPerArea(ares, defaultOptions(options));
}

export function getSeatCoordinatesPerArea<Party>(
    apollo: NSeatsPerPartyPerArea<Party>,
    options: Partial<Readonly<Options>> = {},
): CoordinatesPerPartyPerArea<Party> {
    const {
        wingNRows,
        crossNCols,
        packed,
        // fullWidth,
    } = defaultOptions(options);

    const demeter = getRowsAndColsPerArea(apollo, { wingNRows, crossNCols, packed, /*fullWidth*/ });
    return getCoordinates(apollo, demeter, { packed });
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
