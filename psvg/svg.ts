import { Seat } from "./geometry";

const SVG_NS = "http://www.w3.org/2000/svg";

function documentElementCreator(
    tag: string,
    attributes: Record<string, unknown>,
    content?: any,
) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const k in attributes) {
        e.setAttribute(k, attributes[k] as string);
    }
    if (content) {
        e.append(content);
    }
    return e;
}

export default function generateSVG(
    points: Seat[],
    radius: number,
    seatDistance: number,
    {seatCount, elementCreator}: {seatCount: boolean, elementCreator: undefined | typeof documentElementCreator},
): SVGSVGElement {
    elementCreator ??= documentElementCreator;
    const elements = points.map(p => elementCreator('circle', {
        cx: p.x,
        cy: p.y,
        r: p.r,
        fill: p.fill,
        class: p.party,
    }));

    if (seatCount) {
        elements.push(elementCreator('text', {
            x: 0,
            y: 0,
            'text-anchor': 'middle',
            style: {
                'font-family': 'Helvetica',
                'font-size': `${.25*radius}px`,
            },
            class: 'seatNumber',
        }, elements.length));
    }

    const svg = elementCreator('svg', {
        xmlns: SVG_NS,
        viewBox: `${-radius - seatDistance/2}, ${-radius - seatDistance/2}, ${2*radius + seatDistance}, ${radius + seatDistance}`,
    }, elements) as SVGSVGElement;
    return svg;
}
