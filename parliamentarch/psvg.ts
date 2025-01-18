type Parliament = {[partyname: string]: {seats: number, colour: string}};
type XYR = {x: number, y: number, r: number};
type Seat = XYR & {fill: string, party: string};

function seatSum(o: Parliament) {
    return Array.from(Object.values(o), v => v.seats).reduce((a, b) => a + b, 0);
}
function merge<T>(arrays: ReadonlyArray<ReadonlyArray<T>>): T[] {
    return ([] as T[]).concat(...arrays);
}

function coords(r: number, b: number) {
    return {
        x: r * Math.cos(b/r - Math.PI),
        y: r * Math.sin(b/r - Math.PI),
    }
}

function calculateSeatDistance(seatCount: number, numberOfRings: number, r: number) {
    const x = (Math.PI * numberOfRings * r) / (seatCount - numberOfRings);
    const y = 1 + (Math.PI * (numberOfRings - 1) * numberOfRings/2) / (seatCount - numberOfRings);

    return x / y;
}

function score(m: number, n: number, r: number) {
    return Math.abs(calculateSeatDistance(m, n, r) * n / r - 5/7);
}

function calculateNumberOfRings(seatCount: number, r: number) {
    let n = Math.floor(Math.log(seatCount) / Math.log(2)) || 1;
    let distance = score(seatCount, n, r);

    let direction = 0;
    if (score(seatCount, n + 1, r) < distance) {
        direction = 1;
    }
    if (score(seatCount, n - 1, r) < distance && n > 1) {
        direction = -1;
    }

    while (score(seatCount, n + direction, r) < distance && n > 0) {
        distance = score(seatCount, n + direction, r);
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

function attribution(partyscores: object, n: number): number[] {
    throw new Error("Not implemented");
}

function generatePoints(parliament: Parliament, r0: number) {
    const seatCount = seatSum(parliament);
    const numberOfRings = calculateNumberOfRings(seatCount, r0);
    const seatDistance = calculateSeatDistance(seatCount, numberOfRings, r0);

    // calculate ring radii
    const rings: number[] = Array(numberOfRings+1);
    for (let i = 0; i <= numberOfRings; i++) {
        rings[i] = r0 - (i - 1) * seatDistance;
    }
    // FIXME this is a sparse array starting at index 1

    // calculate seats per ring
    const seatsPerRing = attribution(rings, seatCount);
    // FIXME sparse array again
    // also don't use overkill sainte-laguë, just do iteratively
    // from the legacy code and the `rings` formula above
    // the attribution is just proportional to the ring radius

    const pointCoordinates: XYR[][] = [];

    // build seats
    // loop rings (?)
    for (let i = 1; i <= numberOfRings; i++) {
        const ring: XYR[] = [];
        // calculate the radius of the ring
        const r = r0 - (i - 1) * seatDistance;
        // calculate ring-specific distance (of what ?)
        const a = (Math.PI * r) / ((rings[i] - 1) || 1);

        // loop over the points
        for (let j = 0; j <= seatsPerRing[i] - 1; j++) {
            const point = {...coords(r, a * j), r: .4 * seatDistance};
            ring.push(point);
        }
        pointCoordinates.push(ring);
    }

    // fill the seats
    const ringProgress = Array(numberOfRings).fill(0);
    const seats: Seat[][] = Array.from({length: numberOfRings}).map(() => []);
    for (const partyname in parliament) {
        for (let i = 0; i < parliament[partyname].seats; i++) {
            const ring = nextRing(pointCoordinates, ringProgress);
            seats[ring].push({...pointCoordinates[ring][seats[ring].length], fill: parliament[partyname].colour, party: partyname});
            ringProgress[ring]++;
        }
    }

    return merge(seats);
}

function h(a: string, o: Record<string, any>, content?: any) {
    const e = document.createElementNS(SVG_NS, a);
    for (const k in o) {
        e.setAttribute(k, o[k]);
    }
    if (content) {
        e.textContent = content;
    }
    return e;
}

function pointToSVG(hfn: typeof h) {
    return function(point: Seat) {
        return hfn('circle', {
            cx: point.x,
            cy: point.y,
            r: point.r,
            fill: point.fill,
            class: point.party,
        });
    }
}

const defaults = {
    seatCount: false,
};

const SVG_NS = "http://www.w3.org/2000/svg";

export default function generate(parliament: Parliament, {seatCount} = defaults) {
    const radius = 20;
    const points = generatePoints(parliament, radius);
    const a = points[0].r / .4;
    const elements = points.map(pointToSVG(h));

    if (seatCount) {
        elements.push(h('text', {
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

    const svg = h('svg', {
        xmlns: SVG_NS,
        viewBox: `${-radius - a/2}, ${-radius - a/2}, ${2*radius + a}, ${radius + a}`,
    }, elements);
    return svg;
}
