import assert from "node:assert/strict";
import test from "node:test";
import { currentPlan, documentLabel, documentRoom, plans } from "./plans.ts";

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

test("document allowances are 100, 200, and 1500", () => {
  assert.deepEqual(
    plans.map((plan) => plan.documents),
    [100, 200, 1500],
  );
  assert.deepEqual(plans.map(documentLabel), ["100 documents", "200 documents", "1,500 documents"]);
});

test("paid plan rooms still name 200 and 1,500 documents", () => {
  const paid = plans.filter((plan) => !plan.enabled);
  assert.deepEqual(
    paid.map((plan) => documentRoom(plan.documents, plan)),
    ["The $5 plan holds 200 documents.", "The $20 plan holds 1,500 documents."],
  );
  for (const plan of paid) {
    assert.equal(documentRoom(plan.documents - 1, plan), null);
  }
});

test("the current plan refuses a library that is already full", () => {
  const plan = currentPlan();
  assert.equal(plan.name, "Free");
  assert.equal(documentRoom(plan.documents - 1, plan), null);
  assert.equal(documentRoom(plan.documents, plan), "The Free plan holds 100 documents.");
});
