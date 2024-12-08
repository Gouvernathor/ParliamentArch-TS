import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ["parliamentarch.ts", "parliamentarch/geometry.ts", "parliamentarch/svg.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
});
