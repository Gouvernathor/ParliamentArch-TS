import { AllocatedSeatsPerArea, Area, areaRecord } from "@parliamentarch/westminster-core/utils";
import "./document-loader.js";

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

    populateHeader(svg);

    addAreas(svg, poseidon, { roundingRadius, spacingFactor });

    return svg;
}

function populateHeader(svg: SVGSVGElement) {
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    // TODO viewBox

    svg.appendChild(document.createComment("Created with ParliamentArch-Westminster (https://github.com/Gouvernathor/ParliamentArch-TS)"));
}

function addAreas(
    svg: SVGSVGElement,
    poseidon: AllocatedSeatsPerArea<SeatData>,
    options: Readonly<GetSVGOptions>,
) {
    const areas = areaRecord(area =>
        svg.appendChild(createArea(poseidon[area], options)));

    areas; // TODO place the areas
}

// TODO handle the class seat data version
function createArea(
    partyData: AllocatedSeatsPerArea<SeatData>[Area],
    options: Readonly<GetSVGOptions>,
): SVGGElement {
    const areaGroup = document.createElementNS(SVG_NS, "g");

    for (const [party, nSeats] of partyData) {}

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

    // TODO move those up at least to the <g>
    rect.setAttribute("width", `${1 - spacingFactor}`);
    rect.setAttribute("height", `${1 - spacingFactor}`);

    return rect;
}
