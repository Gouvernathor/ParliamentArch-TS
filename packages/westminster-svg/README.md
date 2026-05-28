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




```js
const attrib = {speak: [{nSeats:2}], opposition: [{color:"red",nSeats:51},{color:"orange",nSeats:49}], government: [{color:"blue", nSeats:61},{color:"rebeccapurple",nSeats:59}], cross: [{color:"green",nSeats:10}, {color:"limegreen",nSeats:8}, {color:"yellow",nSeats:3}]};
const fs = await import("fs");
const outerHTML = (await import("@parliamentarch/westminster-svg")).getSVGFromAttribution(attrib, {packed:false}).outerHTML;
fs.writeFileSync("./westSample.svg", outerHTML);
```




`Party`

An interface for data about a party or group of seats. It contains:

- `color: string`: The color with which to fill the seat square, as a CSS color.
- `id?: string`: An optional id for the group of seats.
- `data?: string`: An optional text to display when hovering over the seat.
- `borderSize?: number`: The size of the border around the seat square, defaults to 0.
- `borderColor?: string`: The color of the border, defaults to black.
- `roundingRadius?: number`: The rounding radius of the square representing each seat, from 0 (square) to 1 (circle).

`getSVGFromAttribution(attribution, options?): SVGSVGElement`

This function creates the diagram as an SVG element which can then be integrated in the DOM. The parameters are as follows:

- `attribution`: this accepts a wide range of input formats, which you can inspect using TypeScript typing. The easiest format is an array of objects containing, for each party, "nSeats" a number of seats, "area" the name of an area as described above, and the other fields of `Party` objects. The ordering of the elements of the same area matters, and the groups as provided will be drawn from left to right in the diagram.
- `options.wingNRows`: the number of rows for each of the two wings (government and opposition). Ignored if 0, invalid if negative. If 0 (or not passed), the number of rows is calculated automatically.
- `options.crossNCols`: the number of columns for the crossbenchers area. Invalid if negative. If 0 (or not passed), or if inferior to the total number of crossbenchers, the number of columns is calculated automatically.
- `options.cozy`: Whether parties of the same area are allowed to share the same column - or the same row for the crossbenchers. Defaults to true.
- `options.roundingRadius`: the default value for the rounding radius of the squares representing the seats, unless overridden by the `roundingRadius` property of a group object. From 0 (squares) to 1 (circles). Defaults to 0.
- `options.spacingFactor`: the relative spacing between neighboring seats of the same area. This is multiplied by the size of a square to get the actual spacing between two neighboring seats. Defaults to 0.1.
