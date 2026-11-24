# Changelog

This project adheres to [Semantic Versioning](https://semver.org/).

## (core) Unreleased major

### Removed

- The FillingStrategy runtime object, relegated to a type only
- The overload of `getMajorityLineCheckpoints` without a `SeatLayout` parameter
- The `rowThickness` field of the `MajorityLineCheckpoints` object

## (core) Unreleased minor

### Added

- `getSeatLayout` and `getSeatCentersFromLayout`, which break up `getSeatCenters` into two functions:
  - `getSeatLayout` computes an opaque `SeatLayout` from the number of seats and the same options as `getSeatCenters`.
  - `getSeatCentersFromLayout` computes the seat center coordinates from a `SeatLayout`.
- The new `maxSeatRadius` field on the `MajorityLineCheckpoints` objects, which should be used instead of the deprecated `rowThickness` field.

### Fixed

- In some situations the attribution of seats across rows was wrong, and the number of seats on the last row overflowed the row's capacity. This fix goes along with the slight change in the formula for the number of seats per row.
- `getMajorityLineCheckpoints` threw a TypeError when any row had no seats, as happens with the `"empty_inner"` and `"outer_priority"` strategies.
- `precomputeFromAttribution` ignored `minNRows` when computing `seatActualRadius`, so with more rows than necessary the seats were drawn too large and overlapped.

### Changed

- Improved the formula for the number of seats fitting in a row, which is slightly fewer than the previous formula provided.
- `getMajorityLineCheckpoints` takes a `SeatLayout` as parameter instead of recomputing some values from the number of rows.

### Deprecated

- The FillingStrategy runtime object and enum
- Calling `getMajorityLineCheckpoints` without a `SeatLayout` parameter
- The `rowThickness` field of the `MajorityLineCheckpoints` object

## (svg) 5.2.0 - 2026-08-10

### Added

- Added the ability to specify a dasharray visual effect to seat borders.

## (svg) 5.1.1 - 2026-07-05

### Added

- Specify the font size for the number of seats in px in addition to rem, as a fallback for systems not supporting rem units (notably, Wikimedia Commons).
