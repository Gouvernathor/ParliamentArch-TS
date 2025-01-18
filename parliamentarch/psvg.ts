type Parliament = {[partyname: string]: {seats: number, colour: string}};
type XYR = {x: number, y: number, r: number};
type Seat = XYR & {fill: string, party: string};

function seatSum(o: Parliament) {
    return Array.from(Object.values(o), v => v.seats).reduce((a, b) => a + b, 0);
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

function attribution(partyscores: Record<number, number>, n: number): Record<number, number>;
function attribution(partyscores: Record<string, number>, n: number): Record<string, number>;
function attribution<K extends string|number>(partyscores: Record<K, number>, n: number): Record<K, number> {
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

    const pointCoordinatesPerRing = ringRadii.map((r, i) => {
        // calculate ring-specific distance (of what ?)
        const a = (Math.PI * r) / ((r - 1) || 1);

        return Array.from({length: seatsPerRing[i]}, (_, j) => ({...coords(r, a * j), r: .4 * seatDistance}));
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
