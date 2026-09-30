export const CIRCUIT_VIEWBOX = { width: 1440, height: 900 };

export interface CircuitTrace {
  id: string;
  d: string;
  duration: number;
  delay: number;
}

export interface CircuitPad {
  id: string;
  x: number;
  y: number;
  delay: number;
}

export interface CircuitChip {
  id: string;
  x: number;
  y: number;
}

export interface AnimationStyle {
  animationDuration: string;
  animationDelay: string;
}

type Point = [number, number];

interface TraceRoute {
  id: string;
  points: Point[];
  duration: number;
  delay: number;
}

/**
 * Every route is drawn with horizontal, vertical, and 45° segments only, like a
 * printed circuit board. Routes stay out of the headline area (x 80–620,
 * y 180–560) and gather in the corners and along the edges. A few run behind
 * the workspace preview window on the right.
 */
const ROUTES: TraceRoute[] = [
  {
    id: "left-rail",
    points: [
      [30, 140],
      [30, 330],
      [56, 356],
      [56, 540],
    ],
    duration: 11,
    delay: -0.5,
  },
  {
    id: "top-left-run",
    points: [
      [110, 16],
      [110, 80],
      [170, 140],
      [420, 140],
    ],
    duration: 9,
    delay: -3.2,
  },
  {
    id: "top-mid-step",
    points: [
      [500, 30],
      [620, 30],
      [660, 70],
      [660, 130],
    ],
    duration: 8,
    delay: -6.1,
  },
  {
    id: "top-gap-step",
    points: [
      [460, 16],
      [460, 60],
      [500, 100],
      [600, 100],
      [640, 140],
    ],
    duration: 9,
    delay: -7.7,
  },
  {
    id: "top-right-run",
    points: [
      [740, 44],
      [900, 44],
      [940, 84],
      [1180, 84],
    ],
    duration: 10,
    delay: -1.7,
  },
  {
    id: "right-rail",
    points: [
      [1250, 16],
      [1250, 110],
      [1310, 170],
      [1310, 300],
      [1370, 360],
      [1370, 470],
    ],
    duration: 13,
    delay: -4.4,
  },
  {
    id: "far-right-drop",
    points: [
      [1410, 240],
      [1410, 560],
      [1370, 600],
      [1370, 700],
    ],
    duration: 12,
    delay: -8.3,
  },
  {
    id: "behind-preview-left",
    points: [
      [820, 180],
      [820, 400],
      [860, 440],
      [860, 600],
    ],
    duration: 11,
    delay: -2.6,
  },
  {
    id: "behind-preview-right",
    points: [
      [1100, 160],
      [1100, 240],
      [1160, 300],
      [1160, 520],
      [1120, 560],
      [1120, 640],
    ],
    duration: 14,
    delay: -5.5,
  },
  {
    id: "preview-shoulder",
    points: [
      [960, 120],
      [1020, 120],
      [1060, 160],
      [1060, 260],
    ],
    duration: 7,
    delay: -0.9,
  },
  {
    id: "bottom-left-run",
    points: [
      [20, 640],
      [20, 760],
      [60, 800],
      [300, 800],
      [340, 840],
      [340, 890],
    ],
    duration: 12,
    delay: -7.2,
  },
  {
    id: "bottom-left-loop",
    points: [
      [120, 600],
      [120, 700],
      [180, 760],
      [460, 760],
      [500, 720],
      [500, 600],
    ],
    duration: 13,
    delay: -3.8,
  },
  {
    id: "bottom-center",
    points: [
      [600, 890],
      [600, 820],
      [640, 780],
      [900, 780],
      [940, 820],
      [940, 890],
    ],
    duration: 11,
    delay: -9.6,
  },
  {
    id: "under-hero",
    points: [
      [580, 640],
      [580, 720],
      [620, 760],
      [760, 760],
      [800, 720],
    ],
    duration: 9,
    delay: -1.3,
  },
  {
    id: "bottom-right-run",
    points: [
      [1000, 620],
      [1000, 700],
      [1040, 740],
      [1240, 740],
      [1280, 780],
      [1280, 880],
    ],
    duration: 12,
    delay: -6.7,
  },
  {
    id: "bottom-right-loop",
    points: [
      [1100, 890],
      [1100, 840],
      [1140, 800],
      [1200, 800],
      [1240, 840],
      [1240, 890],
    ],
    duration: 10,
    delay: -5.1,
  },
  {
    id: "bottom-far-right",
    points: [
      [1340, 890],
      [1340, 840],
      [1400, 780],
      [1400, 640],
    ],
    duration: 8,
    delay: -2.1,
  },
  {
    id: "preview-tail",
    points: [
      [1200, 580],
      [1260, 580],
      [1300, 620],
      [1340, 620],
    ],
    duration: 7,
    delay: -4.9,
  },
];

function pathFromPoints(points: Point[]) {
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

export const CIRCUIT_TRACES: CircuitTrace[] = ROUTES.map((route) => ({
  id: route.id,
  d: pathFromPoints(route.points),
  duration: route.duration,
  delay: route.delay,
}));

const PAD_DELAY_STEP = 0.35;

export const CIRCUIT_PADS: CircuitPad[] = ROUTES.flatMap((route, index) => {
  const start = route.points[0];
  const end = route.points[route.points.length - 1];
  return [
    {
      id: `${route.id}-start`,
      x: start[0],
      y: start[1],
      delay: ((index * 2) % 12) * PAD_DELAY_STEP,
    },
    { id: `${route.id}-end`, x: end[0], y: end[1], delay: ((index * 2 + 1) % 12) * PAD_DELAY_STEP },
  ];
});

export const CIRCUIT_CHIPS: CircuitChip[] = [
  { id: "chip-top-left", x: 180, y: 70 },
  { id: "chip-top-right", x: 1060, y: 40 },
  { id: "chip-right", x: 1330, y: 740 },
  { id: "chip-bottom-left", x: 200, y: 830 },
  { id: "chip-bottom-center", x: 700, y: 840 },
  { id: "chip-bottom-right", x: 1180, y: 660 },
];

export function traceStyle(trace: CircuitTrace): AnimationStyle {
  return { animationDuration: `${trace.duration}s`, animationDelay: `${trace.delay}s` };
}

export function padStyle(pad: CircuitPad): AnimationStyle {
  return { animationDuration: "3.5s", animationDelay: `${pad.delay}s` };
}
