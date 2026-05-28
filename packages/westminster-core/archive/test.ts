// TODO move that to integrated tests
function doesItFit(
    { nRows: wingRows, nCols: wingCols }: RowCols,
    { nRows: crossRows, nCols: crossCols }: RowCols,
    apollo: NSeatsIterablePerArea,
    requestedHera: NSeatsPerArea,
    packed: boolean,
): boolean {
    if (packed) {
        if (requestedHera.opposition > wingRows * wingCols) {
            return false;
        }
        if (requestedHera.government > wingRows * wingCols) {
            return false;
        }
        if (requestedHera.cross > crossRows * crossCols) {
            return false;
        }
    } else {
        const oppositionNecessaryCols = reduceNotPacked(apollo.opposition.values(), wingRows);
        if (oppositionNecessaryCols > wingCols) {
            return false;
        }

        const governmentNecessaryCols = reduceNotPacked(apollo.government.values(), wingRows);
        if (governmentNecessaryCols > wingCols) {
            return false;
        }

        const crossNecessaryRows = reduceNotPacked(apollo.cross.values(), crossCols);
        if (crossNecessaryRows > crossRows) {
            return false;
        }
    }

    return true;
}
