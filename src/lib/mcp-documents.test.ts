import assert from "node:assert/strict";
import test from "node:test";
import {
  presentListedDocument,
  presentReadableDocument,
  presentSearchHit,
  requestOrigin,
} from "./mcp-documents.ts";

test("search hits keep id, type, title, absolute url, score, and excerpt", () => {
  assert.deepEqual(
    presentSearchHit(
      {
        id: "doc-1",
        type: "note",
        title: "Checkout",
        url: "https://pamiac.example/d/doc-1",
        excerpt: "Pay the invoice",
      },
      0.42,
    ),
    {
      id: "doc-1",
      type: "note",
      title: "Checkout",
      url: "https://pamiac.example/d/doc-1",
      score: 0.42,
      excerpt: "Pay the invoice",
    },
  );
});

test("list rows keep id, type, title, url, and updatedAt", () => {
  const listed = presentListedDocument(
    {
      id: "doc-2",
      type: "diagram",
      title: "Orders",
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    },
    "https://pamiac.example",
  );
  assert.deepEqual(listed, {
    id: "doc-2",
    type: "diagram",
    title: "Orders",
    url: "https://pamiac.example/d/doc-2",
    updatedAt: "2026-03-01T00:00:00.000Z",
    folderId: null,
  });
});

test("readable documents serialize updatedAt", () => {
  const readable = presentReadableDocument({
    id: "doc-3",
    title: "Note",
    updatedAt: new Date("2026-04-02T05:06:07.000Z"),
  });
  assert.equal(readable.updatedAt, "2026-04-02T05:06:07.000Z");
  assert.equal(readable.id, "doc-3");
});

test("document origin prefers forwarded host and proto", () => {
  const forwarded = requestOrigin({
    headers: new Headers({
      "x-forwarded-host": "pamiac.example",
      "x-forwarded-proto": "https",
    }),
    url: "http://internal/api/mcp",
  });
  assert.equal(forwarded, "https://pamiac.example");

  const local = requestOrigin({
    headers: new Headers(),
    url: "http://localhost:3000/api/mcp",
  });
  assert.equal(local, "http://localhost:3000");

  const defaultProto = requestOrigin({
    headers: new Headers({ "x-forwarded-host": "pamiac.example" }),
    url: "http://internal/api/mcp",
  });
  assert.equal(defaultProto, "https://pamiac.example");
});
