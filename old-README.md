# ParliamentArch-TS

Generation of arch-styled SVG parliamentary diagrams.

This is a TypeScript port of the [ParliamentArch](https://github.com/Gouvernathor/parliamentarch) Python module, itself a spin-off from David Richfield's [ParliamentDiagram](https://github.com/slashme/parliamentdiagram).

You can install it as a [package](https://www.npmjs.com/package/parliamentarch) using `npm install parliamentarch`. Both browser and Node.js environments are supported, though it needs special handling in the case of Node.js.

![Example diagram](sample.svg)

## Node.js usage

If you want to use ParliamentArch in Node.js, you need to provide a global `document` constant (`globalThis.document`) before importing the module.
The easiest way to do this is to use the [jsdom](https://www.npmjs.com/package/jsdom) package, which you can install with `npm install jsdom`. Then, you can do something like this:

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

## Main module contents

These are found in the `parliamentarch` module.

`getSVGFromAttribution(attribution, options?): SVGSVGElement`

This function creates the diagram as an SVG element which can then be integrated in the DOM. The parameters are as follows:

- `attribution: Map<SeatData, number> | SeatDataWithNumber[]`: a mapping from a SeatData object to a number of seats in the diagram. Alternatively, an array of SeatDataWithNumber objects. Typically, each SeatData or SeatDataWithNumber object represents a group or party. The ordering of the elements matter, and the groups as provided will be drawn from left to right in the diagram.
- `options.seatRadiusFactor: number`: the optional ratio (between 0 and 1) of the seat radius over the row thickness. Defaults to .8.
- `options`: the rest of the options are those passed through to the similar options parameters of the getSeatsCenters and groupedSVGOptions functions.

## SVG submodule contents

These are found in the `parliamentarch/svg` module.

ParliamentArch can create SVG diagrams in two fashions:
- either it uses ``<g>`` elements to apply group-level styles to the seats, skipping CSS altogether, which allows creating standalone SVG files.
- or it only applies CSS classes to the seats, leaving the user with the task of defining the CSS rules for those classes in the embedding HTML document. In that case, the circle representing each seat are placed directly under the root SVG element, which makes it easier to compare and match structure and seats between diagrams.
  - In that case, you can use ``:nth-child(x of .the-class)`` CSS selectors to target the x-th seat within a group - or among several, if several groups share the same CSS class.

So, the `SeatData` type is an alternative between these two modes of operation. You can Mix and match them within the same diagram and even combine both modes for a single group of seats, but is is recommended to stick to one mode for the whole diagram.

`ClassSeatData`

- `class?: string| readonly string[]`: CSS class or classes to apply to all seats of this group.

`StandaloneSeatData`

- `id?: string`: An optional id to apply to the ``<g>`` element containing all seats of this group.
- `data?: string`: An optional text to display when hovering over the seat.
- `color: string`: The color with which to fill the seat circle, as a CSS color.
- `borderSize?: number`: The size of the border around the seat circle, defaults to 0.
- `borderColor?: string`: The color of the border, defaults to black.

`SeatDataWithNumber`

A sub-type which extends SeatData with an optional `nSeats?: number` property, which defaults to 1. It allows you not to use Map objects.

`getGroupedSVG(seatCentersByGroup, seatActualRadius, options?): SVGSVGElement`

This function creates an SVG element containing the diagram. The parameters are as follows:

- `seatCentersByGroup: Map<SeatData, [number, number][]> | [SeatData, [number, number][]]`: A mapping from the SeatData object of a group of seats to a list of the seat center coordinate pairs, but it can also be passed as an iterable of what wuold be its key-value pairs (the value being itself a pair of coordinates). The order of the seat centers is meaningless.
- `seatActualRadius: number`: The actual radius of the seat circles, in the same unit as the coordinates which is a fraction of `canvasSize` (see below).

The options are as follows:

- `canvasSize?: number`: The height of the 2:1 rectangle in which the diagram is drawn, defaults to 175.
- `margins?: number|[number, number]|[number, number, number, number]`: The margins around that rectangle. If 4 values are given, they are the left, top, right and bottom margins in that order. If 2 values are given, they are the horizontal and vertical margins in that order. If only one value is given, it is used for all margins. Defaults to 5.
- `writeNumberOfSeats?: boolean`: Whether to write the number of seats at the bottom center of the diagram - in the well of the house. Defaults to true.
- `fontSizeFactor?: number`: A factor you should tweak to change the font size of the number of seats. The default value is around .2. Keeping this value constant will keep the font size in scale when changing the canvas size.

## Component submodule contents

These are found in the `parliamentarch/component` module.

This module, even when imported in a side-effect-only manner (i.e. `import 'parliamentarch/component';`), defines a custom element `<parliament-arch>` which can be used in HTML documents.
It matches the exported `ParliamentArch` class.

You can use it in four ways:
- instantiate the class by passing the same parameters to the constructor as to the `getSVGFromAttribution` function, then append the instance to the DOM.
- instantiate the class without parameters, append the instance to the DOM, then call the `setAttributionAndOptions` method with the same parameters as to the `getSVGFromAttribution` function, and call the `render` method.
- use the `<parliament-arch>` tag in HTML, with no attributes or contents, then query it from the DOM and call the `setAttributionAndOptions` method then the `render` method.
- use the `<parliament-arch>` tag in HTML, with attributes and contents as described below.

In the last case, the attributes taken by the `<parliament-arch>` element are the same as the options parameters of the `getSVGFromAttribution` function, but in kebab-case instead of camelCase, and prefixed with `data-`. For example, `seatRadiusFactor` becomes `data-seat-radius-factor`.
The contents of the `<parliament-arch>` element provide the attribution. Each `<party>`, `<group>` or `<seat-data>` child element represents a group of seats. Each such element takes attributes corresponding to the properties of the `SeatData` interface, but again in kebab-case instead of camelCase and prefixed with `data-`. For example, `borderSize` becomes `data-border-size`, and `data` becomes `data-data`. The number of seats in the group is given either by the `data-n-seats` attribute, or by the text content of the element which should be an integer.
As with the `SeatDataWithNumber` interface, the `color` property (`data-color` attribute) is mandatory, while all other properties/attributes are optional.
