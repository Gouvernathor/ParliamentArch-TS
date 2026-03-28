# Parliamentarch-TS Web Component

A web component to generate arch-styled parliamentary diagrams.

This package should not be expected to be kept up-to-date with the other packages.

## Component submodule contents

These are found in the `@parliamentarch/web-component` module.

This module, even when imported in a side-effect-only manner (i.e. `import 'parliamentarch/component';`), defines a `<parliament-arch>` custom element which can be used in HTML documents.
It matches the exported `ParliamentArch` class.

You can use it in four ways:
- instantiate the class by passing the same parameters to the constructor as to the `getSVGFromAttribution` function from the `svg` package, then append the instance to the DOM.
- instantiate the class without parameters, append the instance to the DOM, then call the `setAttributionAndOptions` method with the same parameters as to the `getSVGFromAttribution` function, and call the `render` method.
- use the `<parliament-arch>` tag in HTML, with no attributes or contents, then query it from the DOM and call the `setAttributionAndOptions` method then the `render` method.
- use the `<parliament-arch>` tag in HTML, with attributes and contents as described below.

In the last case, the attributes taken by the `<parliament-arch>` element are the same as the options parameters of the `getSVGFromAttribution` function, but in kebab-case instead of camelCase, and prefixed with `data-`. For example, `seatRadiusFactor` becomes `data-seat-radius-factor`.
The contents of the `<parliament-arch>` element provide the attribution. Each `<seat-group>` child element represents a group of seats. Each such element takes attributes corresponding to the properties of the `SeatData` interface from the `svg` package, but again in kebab-case instead of camelCase and prefixed with `data-`. For example, `borderSize` becomes `data-border-size`, and `data` becomes `data-data`. The number of seats in the group is given either by the `data-n-seats` attribute, or by the text content of the element which should be an integer.
