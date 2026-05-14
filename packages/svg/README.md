# Parliamentarch-TS SVG

Tools to generate arch-styled SVG parliamentary diagrams.

![Example diagram](../../sample.svg)

This package generates SVG DOM nodes (SVGSVGElement objects), which can be serialized into SVG image files.

It requires the `document` global constant in order to generate DOM nodes, either by being executed in a browser, or using stand-ins like `jsdom` in Node.js.

```js
import { JSDOM } from 'jsdom';
globalThis.document = new JSDOM().window.document;

import * as parliamentarch from 'parliamentarch';
import * as fs from 'fs';

const attribution = new Map([
    [{color: "#DD0000"}, 17],
    [{color: "#cc2443"}, 71],
    [{color: "#00c000"}, 38],
    [{color: "#ff8080"}, 66],
    [{color: "#e1a5e1"}, 23],
    [{color: "#ff9900"}, 36],
    [{color: "#ffeb00"}, 93],
    [{color: "#0001b8"}, 34],
    [{color: "#0066cc"}, 47],
    [{color: "#162561"}, 16],
    [{color: "#0d378a"}, 124],
    [{color: "#dddddd"}, 9],
    [{color: "#ffffff"}, 3],
]);

fs.writeFileSync("./sample.svg", parliamentarch.getSVGFromAttribution(attribution).outerHTML);
```

## Module contents

These are found in the `@parliamentarch/svg` module.

ParliamentArch can create SVG diagrams in two fashions:
- either it uses `<g>` elements to apply group-level styles to the seats, skipping CSS altogether, which allows creating standalone SVG files.
- or it only applies CSS classes to the seats, leaving the user with the task of defining the CSS rules for those classes in the embedding HTML document. In that case, the circle representing each seat are placed directly under the root SVG element, which makes it easier to compare and match structure and seats between diagrams.
  - In that case, you can use `:nth-child(x of .the-class)` CSS selectors to target the x-th seat within a group - or among several, if several groups share the same CSS class.

So, the `SeatData` type is an alternative (a union) between these two modes of operation. You can mix and match them within the same diagram and even combine both modes for a single group of seats, but is is recommended to stick to one mode for the whole diagram.

`ClassSeatData`

- `class?: string| readonly string[]`: CSS class or classes to apply to all seats of this group.

`StandaloneSeatData`

- `id?: string`: An optional id to apply to the ``<g>`` element containing all seats of this group.
- `data?: string`: An optional text to display when hovering over the seat.
- `color: string`: The color with which to fill the seat circle, as a CSS color.
- `borderSize?: number`: The size of the border around the seat circle, defaults to 0.
- `borderColor?: string`: The color of the border, defaults to black.

`SeatDataWithNumber`

Extends SeatData with an optional `nSeats?: number` property, which defaults to 1, allowing you not to use Map objects.

`getGroupedSVG(seatCentersByGroup, seatActualRadius, options?): SVGSVGElement`

This function creates an SVG element containing the diagram. The parameters are as follows:

- `seatCentersByGroup: ReadonlyMap<SeatData, readonly (readonly [number, number])[]> | readonly [SeatData, readonly (readonly [number, number])[]]`: A mapping from the SeatData object of a group of seats to a list of the seat center coordinate pairs, but it can also be passed as an iterable of what wuold be its key-value pairs (the value being itself a pair of coordinates). The order of the seat centers is meaningless.
- `seatActualRadius: number`: The actual radius of the seat circles, in the same unit as the coordinates which is a fraction of `canvasSize` (see below).
- `options.seatNumberFontSizeFactor: number`: A factor you can tweak to change the font size of the number of seats. The default value is 1. In the resulting diagram, the font size will be expressed in `rem`, meaning that it will scale with user parameters. Setting this to 0 will prevent the number of seats from being included in the SVG.

`getSVGFromAttribution(attribution, options?): SVGSVGElement`

This function creates the diagram as an SVG element directly from an attribution. The parameters are as follows:

- `attribution: ReadonlyMap<SeatData, number> | readonly SeatDataWithNumber[]`: a mapping from a SeatData object to a number of seats in the diagram. Alternatively, an array of SeatDataWithNumber objects. Typically, each SeatData or SeatDataWithNumber object represents a group or party. The ordering of the elements matter, and the groups as provided will be drawn from left to right in the diagram.
- `options.seatRadiusFactor: number`: the optional ratio (between 0 and 1) of the seat radius over the row thickness. Defaults to .8.
- `options`: the rest of the options are those taken by the `precomputeFromAttribution` function from the `core/utils` module, and by the `getGroupedSVG` function.

## Adding a margin

The currently generated diagrams are SVG files with no defined size, taking the available room to display themselves.
Previous versions of ParliamentArch generated images with a fixed size, and also had some transparent padding on the borders.

To get an equivalent of the previous behavior, you can use the following code:

```js
function fixedSizeAndMargin(
    /** The no-size image generated by the module */
    svg: SVGSVGElement,
    /** The height of the diagram without the margin (radius of the arch) */
    canvasSize = 175,
    /** As taken by the CSS margin property, but as numbers without units */
    margin = 5,
) {
    const topMargin = margin[0] ?? margin;
    const rightMargin = margin[1] ?? topMargin;
    const bottomMargin = margin[2] ?? topMargin;
    const leftMargin = margin[3] ?? rightMargin;

    const width = leftMargin + 2 * canvasSize + rightMargin;
    const height = topMargin + canvasSize + bottomMargin;

    // if the new SVG module made it, then document is available
    const outerSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    outerSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    outerSVG.appendChild(svg);
    svg.setAttribute("x", leftMargin.toString());
    svg.setAttribute("y", topMargin.toString());
    svg.setAttribute("width", (2*canvasSize).toString());
    svg.setAttribute("height", canvasSize.toString());
    outerSVG.setAttribute("width", width.toString());
    outerSVG.setAttribute("height", height.toString());
    return outerSVG;
}
```
