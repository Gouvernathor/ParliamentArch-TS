# ParliamentArch-TS

Generation of arch-styled parliamentary diagrams.

This is a collection of TypeScript/JavaScript packages, evolved as a spin-off from David Richfield's [ParliamentDiagram](https://github.com/slashme/parliamentdiagram), through the [ParliamentArch](https://github.com/Gouvernathor/parliamentarch) Python module and the original [`parliamentarch` npm package](https://www.npmjs.com/package/parliamentarch).

![Example diagram](sample.svg)

## Packages

- [`@parliamentarch/core`](./packages/core) handles two things: majorly, the geometry of how the seats are arranged in space, and as an aside, some util functions shared by the other modules taking over from there.
- [`@parliamentarch/svg`](./packages/svg) uses `core` in order to generate SVG files or DOM nodes. However, it only works if either being used in a browser, or having an emulator of the DOM functions (such as [jsdom](https://www.npmjs.com/package/jsdom)) in Node.js.
- [`@parliamentarch/web-component`](./packages/web-component) provides a Web Component to generate the same diagrams, relying on the other packages. That package will receive less support and updates than the others.

- [`@parliamentarch/westminster-core`](./packages/westminster-core) and [`@parliamentarch/westminster-svg`](./packages/westminster-svg) are equivalent packages to generate squary Westminster-style parliament diagrams. (The notion of "arch" kind of loses its meaning there.)

- `@parliamentarch/angular`, not yet available, will provide an Angular component (or a suite of components) to display the same arches, depending on `core` but free from `svg`'s reliance on a DOM emulator - though it is, obviously, depending on Angular.

- `@parliamentarch/westminster-web-component` and `@parliamentarch/westminster-angular` may happen some day.
