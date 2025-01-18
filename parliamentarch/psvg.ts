type Parliament = {[partyname: string]: {seats: number, colour: string}};
type XYR = {x: number, y: number, r: number};
type Seat = XYR & {fill: string, party: string};

function seatSum(p: Parliament) {
    return Array.from(Object.values(p), v => v.seats).reduce((a, b) => a + b, 0);
}

function coords(ringRadius: number, b: number) {
    return {
        x: ringRadius * Math.cos(b/ringRadius - Math.PI),
        y: ringRadius * Math.sin(b/ringRadius - Math.PI),
    }
}

function calculateSeatDistance(seatCount: number, numberOfRings: number, r0: number) {
    const x = (Math.PI * numberOfRings * r0) / (seatCount - numberOfRings);
    const y = 1 + (Math.PI * (numberOfRings - 1) * numberOfRings/2) / (seatCount - numberOfRings);

    return x / y;
}

function score(seatCount: number, n: number, r0: number) {
    return Math.abs(calculateSeatDistance(seatCount, n, r0) * n / r0 - 5/7);
}

function calculateNumberOfRings(seatCount: number, r0: number) {
    let n = Math.floor(Math.log(seatCount) / Math.log(2)) || 1;
    let distance = score(seatCount, n, r0);

    let direction = 0;
    if (score(seatCount, n + 1, r0) < distance) {
        direction = 1;
    }
    if (score(seatCount, n - 1, r0) < distance && n > 1) {
        direction = -1;
    }

    while (score(seatCount, n + direction, r0) < distance && n > 0) {
        distance = score(seatCount, n + direction, r0);
        n += direction;
    }
    return n;
}

function nextRing(
    rings: ReadonlyArray<ReadonlyArray<unknown>>,
    ringProgress: ReadonlyArray<number>,
) {
    const quotas = rings.map((ring, i) => (ringProgress[i] || 0) / ring.length);
    return quotas.indexOf(Math.min(...quotas));
}

function attribution(partyscores: ReadonlyArray<number>, n: number): number[] {
    throw new Error("Not implemented");
}

function generatePoints(parliament: Parliament, r0: number): Seat[] {
    const seatCount = seatSum(parliament);
    const numberOfRings = calculateNumberOfRings(seatCount, r0);
    const seatDistance = calculateSeatDistance(seatCount, numberOfRings, r0);

    // calculate ring radii
    const ringRadii = Array.from({length: numberOfRings}, (_, i) => r0 - i * seatDistance);

    // calculate seats per ring
    const seatsPerRing = attribution(ringRadii, seatCount);
    // Warning: not an array, but a non-sparse number:number object
    // (meaning that length and array methods are missing, only indexing works)

    const pointCoordinatesPerRing = ringRadii.map((radius, ringIdx) => {
        // calculate ring-specific distance (of what ?)
        const a = (Math.PI * radius) / ((radius - 1) || 1);

        return Array.from({length: seatsPerRing[ringIdx]}, (_, seatIdx) => ({...coords(radius, a * seatIdx), r: .4 * seatDistance}));
    });

    // fill the seats
    const ringProgress = Array(numberOfRings).fill(0);
    const seats: Seat[][] = Array.from({length: numberOfRings}).map(() => []);
    for (const partyname in parliament) {
        for (let i = 0; i < parliament[partyname].seats; i++) {
            const ring = nextRing(pointCoordinatesPerRing, ringProgress);
            seats[ring].push({...pointCoordinatesPerRing[ring][seats[ring].length], fill: parliament[partyname].colour, party: partyname});
            ringProgress[ring]++;
        }
    }

    return seats.flat();
}

const SVG_NS = "http://www.w3.org/2000/svg";

function elementCreator(
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

const defaults = {
    seatCount: false,
    elementCreator: elementCreator,
};

export default function generate(parliament: Parliament, {seatCount, elementCreator} = defaults) {
    const radius = 20;
    const points = generatePoints(parliament, radius);
    const a = points[0].r / .4;
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
        viewBox: `${-radius - a/2}, ${-radius - a/2}, ${2*radius + a}, ${radius + a}`,
    }, elements);
    return svg;
}
