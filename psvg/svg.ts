import { Seat } from "./geometry";

const SVG_NS = "http://www.w3.org/2000/svg";

function documentElementCreator(
    tag: string,
    attributes: Record<string, unknown>,
    content?: (string|Element)[],
) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const k in attributes) {
        e.setAttribute(k, attributes[k] as string);
    }
    if (content) {
        e.append(...content);
    }
    return e;
}

export default function generateSVG(
    parties: { [partyname: string]: {fill: string} },
    points: Seat[],
    radius: number,
    seatDistance: number,
    {seatCount, elementCreator}: {seatCount: boolean, elementCreator: undefined | typeof documentElementCreator},
): SVGSVGElement {
    elementCreator ??= documentElementCreator;

    const groups = Object.fromEntries(Object.keys(parties).map(partyname => {
        const party = parties[partyname];
        const gStyle = [
            `fill: ${party.fill};`,
        ].join(' ');
        const group = elementCreator('g', {id: partyname, style: gStyle}) as SVGGElement;
        return [partyname, group];
    }));

    const grouplessElements = [] as SVGElement[];

    for (const point of points) {
        const element = elementCreator('circle', {
            cx: point.x,
            cy: point.y,
            r: point.r,
            class: `seat_${point.party}`,
        }) as SVGCircleElement;
        const group = groups[point.party];
        if (group) {
            group.appendChild(element);
        } else {
            grouplessElements.push(element);
        }
    }

    if (seatCount) {
        grouplessElements.push(elementCreator('text',
            {
                x: 0,
                y: 0,
                'text-anchor': 'middle',
                style: {
                    'font-family': 'Helvetica',
                    'font-size': `${.25*radius}px`,
                },
                class: 'seatNumber',
            },
            [points.length.toString()],
        ));
    }

    return elementCreator('svg',
        {
            xmlns: SVG_NS,
            viewBox: `${-radius - seatDistance/2}, ${-radius - seatDistance/2}, ${2*radius + seatDistance}, ${radius + seatDistance}`,
        },
        (Object.values(groups) as SVGElement[]).concat(grouplessElements),
    ) as SVGSVGElement;
}
