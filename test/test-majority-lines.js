import { JSDOM } from 'jsdom';
globalThis.document = new JSDOM().window.document;

import * as parliamentarch from '@parliamentarch/svg';
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
// const attribution = new Map([
//     [{ color: "red" }, 99],
//     [{ color: "yellow" }, 345],
//     [{ color: "blue" }, 133],
// ]);
// const attribution = new Map([
//     [{ color: "red" }, 67],
//     [{ color: "yellow" }, 187],
//     [{ color: "blue" }, 94],
// ]);

fs.writeFileSync("./sample-maj.svg", parliamentarch.getSVGFromAttribution(attribution, {majorityLines: [
    {nSeats:100, color: "rebeccapurple", dasharray: [1]},
    {round: Math.trunc, color: "grey"},
    {},
    {ratio:.6, color: "orange", dasharray: [2], data: "three-fifths"},
    {ratio:2/3, color: "hotpink", dasharray: [2,1], data: "two-thirds"},
]}).outerHTML);
