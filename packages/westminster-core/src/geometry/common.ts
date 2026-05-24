export interface Options {
    /**
     * The number of rows for each of the two wings.
     * Ignored if 0, invalid if negative.
     * If ignored, the actual number of rows is computed automatically.
     */
    wingNRows: number; // default 0

    /**
     * The number of columns for the crossbenchers.
     * Ignored if 0, invalid if negative,
     * will also be ignored if inferior to the total number of crossbenchers.
     * Previously called centerCols.
     * If ignored, the actual number of columns is computed automatically.
     */
    crossNCols: number; // default 0

    /**
     * Whether parties of the same wing are allowed to share the same column,
     * or the same row for crossbenchers.
     *
     * Formerly called "cozy".
     */
    packed: boolean; // default true

    /**
     * Whether to prioritize having equal columns between the two wings,
     * over having equal rows.
     */
    // fullWidth: boolean; // default false
}

export function defaultOptions({
    wingNRows = 0,
    crossNCols = 0,
    packed = true,
    // fullWidth = false,
}: Partial<Readonly<Options>> = {}): Options {
    return {
        wingNRows,
        crossNCols,
        packed,
        // fullWidth,
    };
}
