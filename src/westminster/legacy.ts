import { Area, areas, wings } from "./common";

/**
 * Makes the document constant available, whether in a browser or in Node.js,
 * without ever importing it in browser mode.
 */
const doc = globalThis.document ??
    (await import("jsdom")
        .then(m => new m.JSDOM())
    ).window.document;

const SVG_NS = "http://www.w3.org/2000/svg";


export function treat_inputlist(
    optionWingrows: number|undefined,
    partylist: Iterable<SeatDataWithNumber>,
    cozy: boolean,
    fullwidth: boolean,
    centercols: number,
    roundingRadius: number,
    spacing: number,
) {
    const parties = new Map<SeatDataWithNumber, number>();
    const sumDelegates = Object.fromEntries(areas.map(area => [area, 0])) as Record<Area, number>;

    for (const party of partylist) {
        parties.set(party, 0);
        sumDelegates[party.group] += party.nSeats;
    }

    const { poslist, wingRows, absoluteRoundingRadius, blockside, svgwidth, svgheight } = seats({
        parties,
        sumDelegates,
        optionWingrows,
        cozy,
        fullwidth,
        centercolsRaw: centercols,
        optionRadius: roundingRadius,
        optionSpacing: spacing,
    });

    return buildSVG(
        parties.keys(),
        poslist,
        blockside*(1-spacing),
        wingRows,
        fullwidth || cozy,
        absoluteRoundingRadius,
        svgwidth,
        svgheight,
    );
}

interface SeatsOptions {
    parties: Map<SeatDataWithNumber, number>;
    sumDelegates: Record<Area, number>;
    optionWingrows: number|undefined;
    cozy: boolean;
    fullwidth: boolean;
    centercolsRaw: number;
    optionRadius: number;
    optionSpacing: number;
}

interface SeatsReturn {
    poslist: Iterable<[Area, [number, number][]]>;
    wingRows: Map<Area, number>;
    absoluteRoundingRadius: number;
    blockside: number;
    svgwidth: number;
    svgheight: number;
}

function seats({
    optionWingrows,
    sumDelegates,
    cozy,
    parties,
    fullwidth,
    centercolsRaw,
    optionRadius,
    optionSpacing,
}: SeatsOptions): SeatsReturn {
    // Left and right are by default blocks of shape 5x1
    // Head (the speaker) is a single row of blocks down the middle,
    // starting one block left of the party blocks, with a half-block gap on each side
    // Cross-bench (center) is by default a block of shape 1x4 at the back

    // keep a list of any empty seats we reserve to space out parties
    const emptySeats = new Map(areas.map(area => [area, 0]));

    // compute the number of ranks
    const nRanks = optionWingrows
        || Math.ceil(Math.sqrt(Math.max(1, sumDelegates.left, sumDelegates.right)/20))*2;

    let wingCols: number;
    if (cozy) {
        wingCols = Math.ceil(Math.max(sumDelegates.left, sumDelegates.right) / nRanks);
    } else {
        // calculate the number of empty seats to add to each wing's delegate count
        for (const wing of wings) {
            for (const [party, ] of parties) {
                if (party.group === wing) {
                    const partycount = -party.nSeats % nRanks;
                    // per-party count of empty seats needed to space out the diagram
                    parties.set(party, partycount);
                    // per-wing count kept separately for convenience
                    emptySeats.set(wing, emptySeats.get(wing)! + partycount);
                }
            }
        }

        // calculate the number of columns in the diagram based on the spaced-out count
        wingCols = Math.ceil(Math.max(sumDelegates.left+emptySeats.get("left")!, sumDelegates.right+emptySeats.get("right")!) / nRanks);
    }

    const wingRows = new Map(wings.map(area => [area, nRanks]));
    // slim down the diagram on one side if required
    if (fullwidth) {
        for (const wing of wings) {
            if (cozy) {
                // if we are not reserving blank seats to space out the diagram,
                // just fit it suitably
                // this will do nothing to the larger wing, but it will slim down the smaller one
                wingRows.set(wing, Math.ceil(sumDelegates[wing] / wingCols));
            } else {
                for (let i = nRanks-1; i > 0; i--) {
                    const tempGaps: number[] = [];
                    for (const [party, ] of parties) {
                        if (party.group === wing) {
                            tempGaps.push((-party.nSeats) % i);
                        }
                    }

                    const sumTempGaps = tempGaps.reduce((a, b) => a + b, 0);

                    // if it doesn't fit
                    if (sumDelegates[wing] + sumTempGaps > wingCols * i) {
                        break;
                    }

                    // if it fits
                    emptySeats.set(wing, sumTempGaps);
                    wingRows.set(wing, i);

                    for (const [party, ] of parties) {
                        if (party.group === wing) {
                            parties.set(party, tempGaps.shift()!);
                        }
                    }
                }
            }
        }
    }

    // calculate the number of columns in the cross-bench
    const centerCols = centercolsRaw > 0 ?
        centercolsRaw :
        Math.ceil(Math.sqrt(sumDelegates.center/4));

    const centerRows = centerCols > 0 ?
        Math.ceil(sumDelegates.center / centerCols) :
        0;

    // calculate the total number of columns in the diagram
    // first see how many for head + wings
    let totalCols: number, leftOffset: number;
    if (sumDelegates.head > 0) {
        totalCols = Math.max(wingCols+1, sumDelegates.head);
        // leave room for the speaker's block to protrude on the left
        leftOffset = 1;
    } else {
        leftOffset = 0;
        totalCols = wingCols;
    }

    // if there's a cross-bench, add an empty row plus the number of cross-bench rows
    if (sumDelegates.center > 0) {
        totalCols += 1 + centerRows;
    }

    // calculate the total number of rows in the diagram
    const totalRows = Math.max(wingRows.get("left")! + wingRows.get("right")! + 2, centerRows);

    // how big is a seat ? SVG canvas is 360x360, with 5px border, so 350x350 usable
    const blocksize = 350 / Math.max(totalCols, totalRows);

    // to make the code later a bit neater, calculate the absolute radius now
    // radius .5 is already a circle
    const absoluteRoundingRadius = Math.min(.5, optionRadius) * blocksize * (1-optionSpacing);

    // so the diagram size is now known
    const svgwidth = blocksize * totalCols + 10;
    const svgheight = blocksize * totalRows + 10;

    // initialize the position lists for each area
    const poslist = new Map(areas.map(area => [area, [] as [number, number][]]));

    // all head blocks are in a single row with the same y position
    // the top-y coordinate of the center block if the wings are balances
    // move it down by half the difference of the wing widths
    const centerTop = svgheight/2 - blocksize*(1-optionSpacing)/2 + (wingRows.get("left")! - wingRows.get("right")!)*blocksize/2;

    // the head
    for (let x = 0; x < sumDelegates.head; x++) {
        const xpos = 5 + blocksize*(x+optionSpacing/2);
        poslist.get("head")!.push([xpos, centerTop]);
    }

    // the cross-bench
    // 5 from the edge, vertically centered
    for (let x = 0; x < centerCols; x++) {
        const thisCol = Math.min(centerRows, sumDelegates.center - x*centerRows);
        for (let y = 0; y < thisCol; y++) {
            const xpos = svgwidth - 5 - (centerCols - x + optionSpacing/2)*blocksize;
            const ypos = (svgheight - thisCol*blocksize)/2 + blocksize*(y + optionSpacing/2);
            poslist.get("center")!.push([xpos, ypos]);
        }
    }
    poslist.get("center")!.sort((a, b) => a[1] - b[1]);

    // the wings
    for (let x = 0; x < wingCols; x++) {
        // left parties are in the top block
        for (let y = 0; y < wingRows.get("left")!; y++) {
            const xpos = 5 + (leftOffset + x + optionSpacing/2)*blocksize;
            const ypos = centerTop - (1.5+y)*blocksize;
            poslist.get("left")!.push([xpos, ypos]);
        }

        // right parties are in the bottom block
        for (let y = 0; y < wingRows.get("right")!; y++) {
            const xpos = 5 + (leftOffset + x + optionSpacing/2)*blocksize;
            const ypos = centerTop + (1.5+y)*blocksize;
            poslist.get("right")!.push([xpos, ypos]);
        }
    }

    for (const wing of wings) {
        const wingPosList = poslist.get(wing)!;
        if (fullwidth && wingRows.get(wing)! > 1) {
            // first sort the spots - will need this whether it's cozy or not
            if (wing === "right") {
                // sort by y coordinate
                wingPosList.sort((a, b) => a[1] - b[1]);
            } else {
                // sort by negative y coordinate
                wingPosList.sort((a, b) => b[1] - a[1]);
            }

            // if we are smooshing them together without gaps, just fill from the bottom up
            if (cozy) {
                // trim the block to the exact number of seats
                // so that filling from the left will fill the whole horizontal space
                poslist.set(wing, wingPosList.slice(0, sumDelegates[wing]));
            } else {
                // grab a block for each party
                // make the x coordinate of all the superfluous seats big
                // so that when it's sorted by x coordinate, they are not allocated

                // sort by x coordinate again
                wingPosList.sort((a, b) => a[0] - b[0]);

                // number of seats in the parties we've done already
                let seatsDone = 0;

                // total filled and necessarily blank seats per wing
                let totSpots = sumDelegates[wing] + emptySeats.get(wing)!;

                // number of blank spots in this wing that need to be allocated to parties
                let extraSpots = wingRows.get(wing)! * wingCols - totSpots;

                for (const [party, val] of parties) {
                    if (party.group === wing) {
                        // total filled and necessarily blank seats in this party
                        const partySpots = party.nSeats + val;

                        let addSpots: number;
                        if (totSpots) {
                            // apportion the extra spots by party size
                            addSpots = Math.round(extraSpots * partySpots / totSpots);
                        } else {
                            // don't add spots
                            addSpots = 0;
                        }

                        // fill it up to a total column
                        addSpots += -addSpots % wingRows.get(wing)!;

                        // grab the slice of seats to work on
                        // sorting this doesn't affect poslist
                        const seatSlice = wingPosList.slice(seatsDone, seatsDone + partySpots + addSpots);
                        extraSpots -= addSpots;

                        // into how many spots do the remaining extra spots have to go ?
                        totSpots -= partySpots + addSpots;

                        // if we're still on the left of the diagram
                        if (partySpots < (sumDelegates[wing] + emptySeats.get(wing)!)/2) {
                            // sort by negative x value
                            seatSlice.sort((a, b) => b[0] - a[0]);
                        }

                        if (wing === "right") {
                            // sort by y coordinate
                            seatSlice.sort((a, b) => a[1] - b[1]);
                        } else {
                            // sort by negative y coordinate
                            seatSlice.sort((a, b) => b[1] - a[1]);
                        }

                        // remove the elements of wingPosList
                        // whose index in seatSlice is >= party.nSeats
                        for (let i = party.nSeats; i < seatSlice.length; i++) {
                            delete wingPosList[wingPosList.indexOf(seatSlice[i]!)];
                        }

                        seatsDone += partySpots + addSpots;
                    }
                }
            }
        }
        wingPosList.sort((a, b) => a[0] - b[0]);
    }

    return {
        poslist,
        wingRows,
        absoluteRoundingRadius,
        blockside: blocksize,
        svgwidth,
        svgheight,
    };
}



export interface SeatData {
    color: string;
    group: Area;
    id?: string|undefined;
    data?: string|undefined;
}
export interface SeatDataWithNumber extends SeatData {
    nSeats: number;
}

export function buildSVG(
    parties: Iterable<SeatDataWithNumber>,
    poslist: Iterable<[Area, [number, number][]]>,
    blockside: number,
    wingRows: unknown,
    fullwidthOrCozy: boolean,
    roundingRadius: number,
    svgwidth: number,
    svgheight: number,
): SVGSVGElement {
    const svg = doc.createElementNS(SVG_NS, "svg");

    populateHeader(svg, svgwidth, svgheight);

    const diagramGroup = svg.appendChild(doc.createElementNS(SVG_NS, "g"));
    diagramGroup.setAttribute("id", "diagram");

    addGroupedSeats(diagramGroup,
        parties, poslist,
        blockside, roundingRadius,
        fullwidthOrCozy);
    return svg;
}

function populateHeader(
    svg: SVGSVGElement,
    width: number,
    height: number,
): void {
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("version", "1.1");
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());

    svg.appendChild(doc.createComment("Created with parliamentarch (https://github.com/Gouvernathor/ParliamentArch-TS)"));
}

function addGroupedSeats(
    base: SVGElement,
    parties: Iterable<SeatDataWithNumber>,
    poslist: Iterable<[Area, [number, number][]]>,
    blockside: number,
    roundingRadius: number,
    fullwidthOrCozy: boolean,
): void {
    let groupNumberFallback = 0;

    for (const [area, positions] of poslist) {
        const iterPositions = positions[Symbol.iterator]();
        const areaGroup = base.appendChild(doc.createElementNS(SVG_NS, "g"));
        areaGroup.setAttribute("id", `${area}-benches`);
        for (const party of parties) {
            if (party.group === area) {
                const partyGroup = areaGroup.appendChild(doc.createElementNS(SVG_NS, "g"));

                partyGroup.setAttribute("id", party.id ?? `group-${groupNumberFallback++}`);
                if (party.data) {
                    partyGroup.appendChild(doc.createElementNS(SVG_NS, "title")).textContent = party.data;
                }

                partyGroup.setAttribute("style", `fill: ${party.color};`);

                for (let i = 0; i < party.nSeats; i++) {
                    const { value: position } = iterPositions.next() as IteratorResult<[number, number]>;
                    const seat = partyGroup.appendChild(doc.createElementNS(SVG_NS, "rect"));
                    seat.setAttribute("x", position[0].toString());
                    seat.setAttribute("y", position[1].toString());
                    seat.setAttribute("rx", roundingRadius.toString());
                    seat.setAttribute("ry", roundingRadius.toString());
                    seat.setAttribute("width", blockside.toString());
                    seat.setAttribute("height", blockside.toString());
                }

                if (!fullwidthOrCozy) {
                    // TODO skip some positions
                }
            }
        }
    }
}
