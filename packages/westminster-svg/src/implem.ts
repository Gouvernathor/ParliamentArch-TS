import { AllocatedSeats, AllocatedSeatsPerArea, areaRecord } from "@parliamentarch/westminster-core/utils";
import "./document-loader.js";
import { NRowsAndColsPerArea } from "../../westminster-core/dist/geometry/rows-cols.js";

const isReadonlyArray: (arg: any) => arg is readonly any[] = Array.isArray;

export interface ClassSeatData {
    /**
     * CSS class or classes to apply to this group of seats.
     */
    readonly class?: string|readonly string[];
}

export interface StandaloneSeatData {
    /**
     * The id of this group of seats.
     */
    readonly id?: string|undefined;
    /**
     * Some human-readable data about this group of seats.
     */
    readonly data?: string|undefined;

    /**
     * Sets the fill color of the seats in this group.
     * In CSS class mode, you can replace this with the "fill" property.
     */
    readonly color: string;

    /**
     * Sets the border size of the seats in this group, as a factor of the seat radius.
     * In CSS class mode, you can replace this with the "stroke-width" property.
     */
    readonly borderSize?: number|undefined;
    /**
     * Sets the color of the border of the seats in this group.
     * In CSS class mode, you can replace this with the "stroke" property.
     */
    readonly borderColor?: string|undefined;
    /**
     * Sets the rounding of the corners of the seats in this group.
     * In CSS class mode, you can replace this with the "rx" and "ry" properties.
     */
    readonly roundingRadius?: number|undefined;
}

export type SeatData = ClassSeatData | StandaloneSeatData;

const SVG_NS = "http://www.w3.org/2000/svg";

export interface GetSVGOptions {
    /**
     * The default value for the rounding radius of the corners of the squares,
     * unless overridden for a specific party.
     */
    roundingRadius: number;

    /**
     * The relative spacing between neighboring squares of the same area.
     * This is to be multiplied by the side of a square
     * to get the actual spacing between two neighboring squares.
     */
    spacingFactor: number;
}

export function getSVG(
    poseidon: AllocatedSeatsPerArea<SeatData>,
    {
        roundingRadius = 0,
        spacingFactor = .1,
    }: Partial<Readonly<GetSVGOptions>> = {},
): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg");

    populateHeader(svg, poseidon);

    addAreas(svg, poseidon, { roundingRadius, spacingFactor });

    return svg;
}

function populateHeader(
    svg: SVGSVGElement,
    { speak, opposition, government, cross }: NRowsAndColsPerArea,
) {
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    svg.setAttribute("viewBox", `${
        -speak.nCols
    } ${
        -Math.max(speak.nRows/2, opposition.nRows && opposition.nRows+1)
    } ${
        speak.nCols + (cross.nCols && cross.nCols+1) + Math.max(government.nCols, opposition.nCols)
    } ${
        Math.max(
            speak.nRows/2, opposition.nRows && opposition.nRows+1, cross.nCols/2,
        ) + Math.max(
            speak.nRows/2, government.nRows && government.nRows+1, cross.nCols/2,
        )
    }`);

    svg.appendChild(document.createComment("Created with ParliamentArch-Westminster (https://github.com/Gouvernathor/ParliamentArch-TS)"));
}

function addAreas(
    svg: SVGSVGElement,
    poseidon: AllocatedSeatsPerArea<SeatData>,
    options: Readonly<GetSVGOptions>,
) {
    // The origin is in front of the speaker, middle of the aisle
    // the speaker goes in negative coordinates
    // the wings are offset by 1 vertically (in opposite directions)
    // the crossbenchers are offset horizontally by the max of the two wing columns

    const offsets = {
        speak: [
            -1,
            -(poseidon.speak.nRows/2),
        ],

        opposition: [
            0,
            -(poseidon.opposition.nRows+1),
        ],

        government: [
            0,
            1,
        ],

        cross: [
            Math.max(poseidon.government.nCols, poseidon.opposition.nCols)+1,
            -(poseidon.cross.nRows/2),
        ],
    } as const;

    areaRecord(area =>
        poseidon[area].size &&
        svg.appendChild(createArea(poseidon[area], options))
            .setAttribute("transform", `translate(${offsets[area]})`));
}

function createArea(
    partyData: AllocatedSeats<SeatData>,
    options: Readonly<GetSVGOptions>,
): SVGGElement {
    const areaGroup = document.createElementNS(SVG_NS, "g");

    for (const [seatData, seats] of partyData) {
        const partyGroup = areaGroup.appendChild(document.createElementNS(SVG_NS, "g"));
        if ("class" in seatData) {
            partyGroup.classList = isReadonlyArray(seatData.class) ?
                seatData.class.join(" ") :
                seatData.class;
        }

        if ("color" in seatData) {
            populatePartyGroupStandalone(partyGroup, seatData, options);
        }

        for (const [x, y] of seats) {
            partyGroup.appendChild(rectWithCoordinates(x, y, options));
        }
    }

    return areaGroup;
}

function populatePartyGroupStandalone(
    partyGroup: SVGGElement,
    seatData: StandaloneSeatData,
    { roundingRadius }: Pick<Readonly<GetSVGOptions>, "roundingRadius">,
): void {
    if (seatData.id !== undefined) {
        partyGroup.setAttribute("id", seatData.id);
    }
    if (seatData.data !== undefined) {
        partyGroup.appendChild(document.createElementNS(SVG_NS, "title"))
            .textContent = seatData.data;
    }

    partyGroup.setAttribute("fill", seatData.color);
    if (seatData.borderSize !== undefined) {
        partyGroup.setAttribute("stroke-width", `${seatData.borderSize}`);
        partyGroup.setAttribute("stroke", seatData.borderColor ?? "black");
    }

    const sRoundingRadius = `${seatData.roundingRadius ?? roundingRadius}`;
    partyGroup.setAttribute("rx", sRoundingRadius);
    partyGroup.setAttribute("ry", sRoundingRadius);
}

function rectWithCoordinates(
    x: number, y: number,
    { spacingFactor }: Pick<GetSVGOptions, "spacingFactor">,
): SVGRectElement {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", `${spacingFactor/2 + x}`);
    rect.setAttribute("y", `${spacingFactor/2 + y}`);

    const sSize = `${1 - spacingFactor}`;
    rect.setAttribute("width", sSize);
    rect.setAttribute("height", sSize);

    return rect;
}
