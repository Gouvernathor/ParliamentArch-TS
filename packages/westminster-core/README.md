# Parliamentarch-TS : Westminster Core

Tools to generate Westminster-styled parliamentary diagrams.

![Example diagram](https://codeberg.org/Gouvernathor/ParliamentArch-TS/raw/westSample.svg)
<!-- absolute link for NPM support -->

This package handles two things: mainly (in the `geometry` submodule), how the seats are arranged in areas and areas in space, and as an aside (in the `utils` submodule), some useful functions to convert various input formats to the one the geometry functions use.

Those won't be enough to generate SVG files or nodes by themselves. In fact, there is nothing specific to SVG in this package, and a wholly different display system could be used to generate a diagram from what this package provides.

## Base layout rules

The parliament is seen from the top down, with the opposition at the top of the diagram, the government at the bottom, an empty aisle between them, and the speaker on the left.

There are four rectangular areas : the speaker(s) area, the opposition area, the government area, and the crossbenchers area. Usually, the speakers area will have one seat and the crossbenchers area will be empty.

Each party has a number of seats and an allocated area (if you want members of a single party to show up in several areas, for instance in the speaker seat, it will be considered as the same party twice).

The parties are arranged in their area, in the order they are provided (usually the biggest ones first). The seats are allocated from left (close to the speaker) to right, and from the aisle outwards (center to top for the opposition, center to bottom for the government). There is an options whether or not neighbor parties should be "packed" and share the same column (defaults to packed).
Usually the two wings don't have the same number of columns and when it is the case, the leftmost columns (closest to the speaker) are aligned.

The crossbenchers are seated opposite the speaker, with a gap between them and the two wings (opposition and government). The area is vertically centered, and the seats are arranged top to bottom and left to right. The "packed" option applies to them too.

It is possible to force the number of rows on the opposition and government wings (same value for both), and the number of columns for the crossbenchers.

The speaker seats are displayed on a single column, vertically centered and on the left of the wings.

The program will first determine the size of each area, and then based on those values, allocate the seats within each area.

## Geometry module contents

These are found in the `@parliamentarch/westminster-core` module.

`NSeatsIterablePerArea`

A type alias. For each area ("speak", "government", "opposition" and "cross"), an object whose values() method returns an iterable of numbers, each being the number of seats for each party in the area.
Notably, that requirement matches an array of numbers or a map whose values are numbers.

`NSeatsPerPartyPerArea<Party>`

A type alias. For each area, a readonly map matching each party (of arbitrary type) to its number of seats. That's a little more specific than the previous type.

`getNumberOfRowsAndColsPerArea(attribution: NSeatsIterablePerArea, { wingNRows?, crossNCols?, packed? }?): NRowsAndColsPerArea`

Returns the size of each area. In the returned object, each area name is mapped to an object where `nCols` is the number of horizontal columns and `nRows` is the number of vertical rows.

- `wingNRows?: number`: forces a number of rows for the government and opposition wings. 0 is ignored, negative is invalid.
- `crossNCols?: number`: forces a number of columns for the crossbenchers area. 0 is ignored, negative is invalid.
- `packed?: boolean`: whether neighbor parties of the same area are allowed to share columns (rows, for the crossbenchers). Defaults to true.

`getAllocatedSeatsPerArea<Party>(attribution: NSeatsPerPartyPerArea<Party>,  wingNRows?, crossNCols?, packed? }?): AllocatedSeatsPerArea<Party>`

Returns, for each area, an object having the `nRows` and `nCols` properties mentioned in the previous function, and being a Map from each party to an array of x/y coordinate pairs, one pair for each seat of the party. The options are the same as the previous function.

## Utils module contents

`anyAttributionToNSeatsPerPartyPerArea<Party>(attribution): NSeatsPerPartyPerArea<Party>`

This function takes in many formats of attribution and converts them to the one expected by the geometry functions.
