import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CIRCUIT_CHIPS,
  CIRCUIT_PADS,
  CIRCUIT_TRACES,
  CIRCUIT_VIEWBOX,
  padStyle,
  traceStyle,
  type CircuitTrace,
} from "./home-circuit.ts";

type Point = [number, number];
type Segment = [Point, Point];

function pointsOf(trace: CircuitTrace): Point[] {
  const commands = trace.d.match(/[ML]\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g) ?? [];
  return commands.map((command) => {
    const [x, y] = command.slice(1).trim().split(/\s+/).map(Number);
    return [x, y];
  });
}

function segmentsOf(points: Point[]): Segment[] {
  return points.slice(1).map((point, index) => [points[index], point]);
}

function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a: Point, b: Point, c: Point) {
  return (
    Math.min(a[0], b[0]) <= c[0] &&
    c[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= c[1] &&
    c[1] <= Math.max(a[1], b[1])
  );
}

function segmentsTouch([a, b]: Segment, [c, d]: Segment) {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  if (d1 * d2 < 0 && d3 * d4 < 0) return true;
  if (d1 === 0 && onSegment(c, d, a)) return true;
  if (d2 === 0 && onSegment(c, d, b)) return true;
  if (d3 === 0 && onSegment(a, b, c)) return true;
  if (d4 === 0 && onSegment(a, b, d)) return true;
  return false;
}

function samePoint(a: Point, b: Point) {
  return a[0] === b[0] && a[1] === b[1];
}

const HEADLINE = { left: 80, right: 620, top: 180, bottom: 560 };

function insideHeadline([x, y]: Point) {
  return x > HEADLINE.left && x < HEADLINE.right && y > HEADLINE.top && y < HEADLINE.bottom;
}

describe("home circuit board data", () => {
  it("keeps the trace count and unique ids the board expects", () => {
    assert.deepEqual(CIRCUIT_VIEWBOX, { width: 1440, height: 900 });
    assert.ok(CIRCUIT_TRACES.length >= 16 && CIRCUIT_TRACES.length <= 20, "16–20 traces");
    assert.equal(new Set(CIRCUIT_TRACES.map((trace) => trace.id)).size, CIRCUIT_TRACES.length);
    assert.equal(new Set(CIRCUIT_PADS.map((pad) => pad.id)).size, CIRCUIT_PADS.length);
    assert.equal(new Set(CIRCUIT_CHIPS.map((chip) => chip.id)).size, CIRCUIT_CHIPS.length);
    assert.ok(CIRCUIT_PADS.length >= 24 && CIRCUIT_PADS.length <= 40, "pads at every trace end");
    assert.ok(CIRCUIT_CHIPS.length >= 6 && CIRCUIT_CHIPS.length <= 8, "6–8 chips");
  });

  it("draws every trace as a PCB route: M then H, V, or 45° segments with 2–5 bends", () => {
    for (const trace of CIRCUIT_TRACES) {
      assert.match(trace.d, /^M /, trace.id);
      const points = pointsOf(trace);
      assert.ok(points.length >= 4 && points.length <= 7, `${trace.id} has 2–5 bends`);
      for (const [[x1, y1], [x2, y2]] of segmentsOf(points)) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        assert.ok(dx + dy > 0, `${trace.id} has no zero-length segment`);
        assert.ok(dx === 0 || dy === 0 || dx === dy, `${trace.id} segment is H, V, or 45°`);
      }
      for (const [x, y] of points) {
        assert.ok(x >= 0 && x <= CIRCUIT_VIEWBOX.width, `${trace.id} stays inside the width`);
        assert.ok(y >= 0 && y <= CIRCUIT_VIEWBOX.height, `${trace.id} stays inside the height`);
      }
    }
  });

  it("starts and ends every trace on a pad", () => {
    const padPoints = CIRCUIT_PADS.map((pad): Point => [pad.x, pad.y]);
    for (const trace of CIRCUIT_TRACES) {
      const points = pointsOf(trace);
      const first = points[0];
      const last = points[points.length - 1];
      assert.ok(
        padPoints.some((pad) => samePoint(pad, first)),
        `${trace.id} starts on a pad`,
      );
      assert.ok(
        padPoints.some((pad) => samePoint(pad, last)),
        `${trace.id} ends on a pad`,
      );
    }
  });

  it("never lets two traces cross or overlap", () => {
    const routes = CIRCUIT_TRACES.map((trace) => ({ id: trace.id, points: pointsOf(trace) }));
    for (let a = 0; a < routes.length; a += 1) {
      for (let b = a + 1; b < routes.length; b += 1) {
        const segmentsA = segmentsOf(routes[a].points);
        const segmentsB = segmentsOf(routes[b].points);
        for (const segmentA of segmentsA) {
          for (const segmentB of segmentsB) {
            const sharedEnd =
              samePoint(segmentA[0], segmentB[0]) ||
              samePoint(segmentA[0], segmentB[1]) ||
              samePoint(segmentA[1], segmentB[0]) ||
              samePoint(segmentA[1], segmentB[1]);
            if (sharedEnd) continue;
            assert.equal(
              segmentsTouch(segmentA, segmentB),
              false,
              `${routes[a].id} touches ${routes[b].id}`,
            );
          }
        }
      }
    }
  });

  it("keeps the headline area clear so the copy stays legible", () => {
    for (const trace of CIRCUIT_TRACES) {
      for (const point of pointsOf(trace)) {
        assert.equal(insideHeadline(point), false, `${trace.id} bends inside the headline area`);
      }
    }
    for (const pad of CIRCUIT_PADS) {
      assert.equal(insideHeadline([pad.x, pad.y]), false, `${pad.id} sits in the headline area`);
    }
  });

  it("staggers the animation timing", () => {
    for (const trace of CIRCUIT_TRACES) {
      assert.ok(trace.duration >= 7 && trace.duration <= 14, `${trace.id} duration 7–14s`);
      assert.ok(trace.delay <= 0, `${trace.id} delay is not positive`);
    }
    assert.ok(new Set(CIRCUIT_TRACES.map((trace) => trace.delay)).size > 8, "delays vary");
    for (const pad of CIRCUIT_PADS) {
      assert.ok(pad.delay >= 0 && pad.delay <= 4, `${pad.id} delay 0–4s`);
    }
    assert.ok(new Set(CIRCUIT_PADS.map((pad) => pad.delay)).size > 4, "pad delays vary");
  });

  it("formats inline animation styles as CSS seconds", () => {
    const trace = CIRCUIT_TRACES[0];
    assert.deepEqual(traceStyle(trace), {
      animationDuration: `${trace.duration}s`,
      animationDelay: `${trace.delay}s`,
    });
    const pad = CIRCUIT_PADS[0];
    assert.deepEqual(padStyle(pad), {
      animationDuration: "3.5s",
      animationDelay: `${pad.delay}s`,
    });
    assert.match(traceStyle(trace).animationDelay, /^-?\d+(\.\d+)?s$/);
    assert.match(padStyle(pad).animationDelay, /^\d+(\.\d+)?s$/);
  });
});
