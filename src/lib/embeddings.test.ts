import assert from "node:assert/strict";
import test from "node:test";
import { cosineSimilarity, EMBEDDING_DIMENSIONS, embedText } from "./embeddings.ts";

test("embeddings are normalized and fixed-width", () => {
  const vector = embedText("A class diagram for checkout payments");
  assert.equal(vector.length, EMBEDDING_DIMENSIONS);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  assert.ok(Math.abs(norm - 1) < 1e-6);
});

test("related text ranks above unrelated text", () => {
  const query = embedText("payment checkout order class");
  const close = cosineSimilarity(query, embedText("Checkout payment order class diagram"));
  const far = cosineSimilarity(query, embedText("seaside watercolor landscape notes"));
  assert.ok(close > far);
});
