```js
const attrib = {speak: [{nSeats:2}], opposition: [{color:"red",nSeats:51},{color:"orange",nSeats:49}], government: [{color:"blue", nSeats:61},{color:"rebeccapurple",nSeats:59}], cross: [{color:"green",nSeats:21}]};
const fs = await import("fs");
const outerHTML = (await import("@parliamentarch/westminster-svg")).getSVGFromAttribution(attrib).outerHTML;
fs.writeFileSync("./westSample.svg", outerHTML);
```
