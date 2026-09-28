import assert from "node:assert/strict";
import test from "node:test";
import { plans } from "./plans.ts";

test("there are exactly three plans", () => {
  assert.equal(plans.length, 3);
});

test("only the free plan is enabled", () => {
  const enabled = plans.filter((plan) => plan.enabled);
  assert.deepEqual(
    enabled.map((plan) => plan.name),
    ["Free"],
  );
});

test("paid plans are disabled and their action label is Coming soon", () => {
  const paid = plans.filter((plan) => plan.name === "$5" || plan.name === "$20");
  assert.equal(paid.length, 2);
  for (const plan of paid) {
    assert.equal(plan.enabled, false);
    assert.equal(plan.action, "Coming soon");
  }
});

test("prices are free, five dollars, and twenty dollars", () => {
  assert.deepEqual(
    plans.map((plan) => plan.price),
    ["$0", "per month", "per month"],
  );
  assert.deepEqual(
    plans.map((plan) => plan.name),
    ["Free", "$5", "$20"],
  );
});
