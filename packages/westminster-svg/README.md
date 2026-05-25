```js
const attrib = {speak: [{nSeats:2}], opposition: [{color:"red",nSeats:51},{color:"orange",nSeats:49}], government: [{color:"blue", nSeats:61},{color:"rebeccapurple",nSeats:59}], cross: [{color:"green",nSeats:10}, {color:"limegreen",nSeats:8}, {color:"yellow",nSeats:3}]};
const fs = await import("fs");
const outerHTML = (await import("@parliamentarch/westminster-svg")).getSVGFromAttribution(attrib, {packed:false}).outerHTML;
fs.writeFileSync("./westSample.svg", outerHTML);
```
