# Parliamentarch-TS : Westminster SVG

Tools to generate Westminster-styled SVG parliamentary diagrams.

![Example diagram](https://codeberg.org/Gouvernathor/ParliamentArch-TS/raw/westSample.svg)
<!-- absolute link for NPM support -->

This package generates SVG DOM nodes (SVGSVGElement objects), which can be serialized into SVG image files.

It requires the `document` global constant in order to generate DOM nodes, either by being executed in a browser, or using stand-ins like `jsdom` in Node.js.

```js
import { getSVGFromAttribution } from "@parliamentarch/westminster-svg";
import * as fs from "fs";

const attribution = {
    speak: [{nSeats:2}],
    opposition: [{color:"red",nSeats:51},{color:"orange",nSeats:49}],
    government: [{color:"blue", nSeats:61},{color:"rebeccapurple",nSeats:59}],
    cross: [{color:"green",nSeats:10}, {color:"limegreen",nSeats:8}, {color:"yellow",nSeats:3}],
};
const outerHTML = getSVGFromAttribution(attribution, { packed:false }).outerHTML;
fs.writeFileSync("./westSample.svg", outerHTML);
```

## Module contents

These are found in the `@parliamentarch/westminster-svg` module.

`getSVGFromAttribution(attribution, { roundingRadius?, spacingFactor?, ...geometryOptions }?): SVGSVGElement`

This function creates an SVG element containing the diagram.

- `attribution`: all the various attribution formats won't be listed here (see `@parliamentarch/westminster-core/utils`). However, the object for the party, which will inform how the seat will be represented, must be a `SeatData` (see below).
- `roundingRadius?: number`: how much the seat corners get rounded. At 0, a full square, at .5, a full circle.
- `spacingFactor?: number`: the relative spacing between neighboring seats of the same area. This is multiplied by the size of a square to get the actual spacing between two neighboring seats. Defaults to 0.1.
- `geometryOptions`: all the options taken by the functions of `@parliamentarch/westminster-core/geometry` can be passed as well.

`SeatData = StandaloneSeatData | ClassSeatData`

This is a type (alias/union) for the object standing in for the parties, and describing how the seats of that party should be displayed.

ParliamentArch can create SVG diagrams in two fashions:
- either it uses `<g>` elements to apply group-level styles to the seats, skipping CSS altogether, which allows creating standalone SVG files. You would use `StandaloneSeatData`.
- or it only applies CSS classes to the seats, leaving the user with the task of defining the CSS rules for those classes in the embedding HTML document. You would use `ClassSeatData`.

`ClassSeatData`

- `class?: string| readonly string[]`: CSS class or classes to apply to all seats of this group.

`StandaloneSeatData`

- `id?: string`: An optional id to apply to the ``<g>`` element containing all seats of this group.
- `data?: string`: Some human-readable data about this group of seats.
- `color: string`: The color with which to fill the seat square, as a CSS color.
- `borderSize?: number`: The size of the border around the seat square, defaults to 0.
- `borderColor?: string`: The color of the border, defaults to black.
- `roundingRadius?: number`: Overrides the same parameter passed to the function.
