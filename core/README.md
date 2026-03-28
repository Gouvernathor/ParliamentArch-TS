# Parliamentarch-TS Core

Tools to generate arch-styled SVG parliamentary diagrams.

![Example diagram](../sample.svg)

This package handles two things: majorly (in the `geometry` submodule), the geometry of how the seats are arranged in space, and as an aside (in the `utils` submodule), some util functions shared by the other modules taking over from there.

Those won't be enough to generate SVG files or nodes by themselves.

## Base math and layout

The idea is to display a certain number of seats so that they collectively form a hemicycle, which is a half-annulus where the inner radius is also a half of the outer radius. The shape fits in a 2:1 rectangle in a landscape orientation, with the hole of the annulus at the bottom.

The seats are placed in rows, such that:

- The rows are semi-circles, concentric to the annulus.
- The difference between the radii of two consecutive rows is a constant called the "row thickness" (radii is the plural of radius).
- The seats are circles (or disks) of equal diameter. That radius divided by the row thickness is called the "seat radius factor".
- The center of a seat is on the semi-circle the seat's row.
- Within each row, the distance between the centers of two consecutive seats is a constant, at least equal to the row thickness.
- The innermost row's semi-circle is the inner arc of the annulus.
- The radius of the outermost row's semi-circle is equal to the radius of the outer arc minus half of the row thickness, such that no seat may overlap the outer arc.
- The vertical distance between the center of the bottom-most seats of each row, which are the first and last seat of each row, is equal to half of the row thickness, such that no seat may overlap the bottom of the rectangle.
- However, when a row contains only one seat, the previous rule does not apply, and the seat is placed at the horizontal center of the diagram.

As a result of these constraints, there is a maximum number of seats that can be placed in a diagram with a given number of rows. For numbers of seats below this maximum, there exists a number of strategies to distribute the seats among the rows.

It is also possible to change the span angle of the diagram (which is 180° in the example above). If a smaller angle is specified, the initial annulus must be cut along two radii of the larger circle. For seat placements, what applied to the bottom of the rectangle now applies to the two radii.

## Tweakable parameters

As hinted above, some parameters can be set to customize the layout of the diagram:

- The span angle of the hemicycle can be sety to a value lower than 180° (higher values are not supported). However, values so low as to prevent some rows from containing even one seat are not supported, will yield incorrect results, and may throw errors in future versions.
- The number of rows can be set higher than the minimum required to hold the provided number of seats. This will result in smaller seats (more precisely, a smaller row thickness).
- The seat radius factor can be set between 0 and 1, with the seats touching their neighbors when the factor is 1.
- As long as the number of seats is not the maximum number of seats for the given number of rows, different strategies can be chosen to distribute the seats.

## Geometry module contents

These are found in the `@parliamentarch/core/geometry` module.

`getNRowsFromNSeats(nSeats: number, spanAngle?: number): number`

Returns the minimum number of rows required to hold the given number of seats in a diagram with the given span angle.

`getRowsFromNRows(nRows: number, spanAngle?: number): number[]`

Returns a list of each row's maximum seat capacity, starting from inner to outer, from a given number of rows and span angle. The list is increasing and its length is equal to the number of rows.

`getRowThickness(nRows: number): number`

Returns the row thickness, i.e the difference between the radii of two consecutive rows, for a given number of rows. This can help converting a seat radius factor (as passed to getSVGFromAttribution) to a seat actual radius as taken by the getSVG functions.

`FillingStrategy`

A string enum of the implemented strategies to fill the seats among the rows:

- `DEFAULT`: The seats are distributed proportionally to the maximal number of seats each row can hold. The result is that the lateral distance between the seats is close among all rows.
- `EMPTY_INNER`: This selects as few outermost rows as necessary to hold the given seats, then distributes the seats proportionally among them. Depending on the number of seats and rows, this either leaves empty inner rows, or is equivalent to the `DEFAULT` strategy. This is equivalent to the legacy "dense rows" option, in that in non-empty rows, the distance between consecutive seats is the smallest possible, and is close among all rows.
- `OUTER_PRIORITY`: This fills the rows to their maximal capacity, starting with the outermost rows going in. The result is that given a number of rows, adding one seat makes a change in only one row.

`getSeatsCenters(nSeats: number, options?): Map<[number, number], number>`

This is the main function of the submodule. The options are as follows:

- `minNRows?: number`: Sets a minimum number of rows.
- `fillingStrategy?: FillingStrategy`: The strategy to use, defaults to `DEFAULT`.
- `spanAngle?: number`: The span angle of the diagram in degrees, defaults to 180.

The function returns a map representing the ensemble of seats. The keys are `[x, y]` pairs, the cartesian coordinates of the center of the seat. The coordinates start from the bottom-left corner of the rectangle, with the x axis pointing to the right and the y axis pointing up. The outer radius of the annulus, equal to the height and to half of the width of the rectangle, is 1, so `x` goes from 0 to 2 and `y` goes from 0 to 1.

The values are the angle, in radians, calculated from the right-outermost point of the annulus arc, through the center of the annulus, to the center of the seat. Sorting the keys by decreasing value returns the seats arranged from left to right. The order of the entries in the Map is meaningless.

## Utils module contents

These are found in the `@parliamentarch/core/utils` module.

`dispatchSeats<SeatDisplay, SeatLocation>(attribution, seats): Map<SeatDisplay, SeatLocation[]>`

This generic function merges an attribution of seat informations with a list of seat locations, to a more useful format.

- `attribution: ReadonlyMap<SeatDisplay, number> | readonly WithNumber<SeatDisplay>[]` (WithNumber meaning that it takes an optional `nSeats` number parameter, defaulting to 1): SeatDisplay usually represents a team owning seats, and this parameter represents how many seats each team has.
- `seats: Iterable<SeatLocation>`: the location of seats. These must be in the same number as the sum of seats for all teams, otherwise an error will be thrown.

`regroupSeatCenters<SeatDisplay, SeatLocation=(readonly [number, number])>(seatCenters): Iterable<readonly [SeatDisplay, readonly SeatLocation[]]>`

This generic function turns one representation of how each seat is displayed, into a more versatile one.

- `seatCenters: Iterable<readonly [SeatLocation, SeatDisplay]>`: a simple, naive mapping of each seat location to how it should be displayed

`precomputeFromAttribution<SeatDisplay>(attribution, options?): PrecomputeReturn<SeatDisplay>`

This function pre-calculates some information from an attribution of seats, making it almost enough to be displayed. The return value is an object containing grouped seat centers as returned by the previous function, under the key `groupedSeatCenters`, and the radius of the seats in the same unit as the coordinates, under the key `seatActualRadius`.

- `attribution: ReadonlyMap<SeatDisplay, number> | readonly WithNumber<SeatDisplay>[]`
- `options.seatRadiusFactor`: the factor between 0 and 1 described earlier. At 1, neighboring seats will touch one another.
- `options`: the rest of the options are the same as taken by the `getSeatsCenters` function.
