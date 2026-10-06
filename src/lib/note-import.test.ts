import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { defaultTitle } from "./content.ts";
import { PERSONAL_SPACE_ID } from "./library-spaces.ts";
import { importNoteTitle, importSharedNote } from "./note-import.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("import note title", () => {
  it("keeps the page title and falls back when it is blank", () => {
    assert.equal(importNoteTitle("Weekly plan"), "Weekly plan");
    assert.equal(importNoteTitle("  Weekly plan  "), "Weekly plan");
    assert.equal(importNoteTitle(""), defaultTitle("note"));
    assert.equal(importNoteTitle("   "), "Untitled note");
    assert.equal(importNoteTitle("Meeting").endsWith(" copy"), false);
  });
});

describe("import shared note", () => {
  it("creates a private note, saves the stored markdown, and returns the new id", async () => {
    const original = globalThis.fetch;
    const calls: { url: string; method: string; body: string }[] = [];
    globalThis.fetch = async (input, init) => {
      const method = String(init?.method ?? "GET");
      calls.push({ url: String(input), method, body: String(init?.body ?? "") });
      if (method === "POST") return Response.json({ id: "doc-new" });
      return Response.json({ ok: true });
    };
    try {
      const stored = 'Body\n\n<!-- pamiac-block-comments {"block":"Keep me"} -->';
      const id = await importSharedNote("Weekly plan", stored, PERSONAL_SPACE_ID);
      assert.equal(id, "doc-new");
      assert.equal(calls.length, 2);
      assert.equal(calls[0]?.url, "/api/documents");
      assert.equal(calls[0]?.method, "POST");
      assert.deepEqual(JSON.parse(calls[0]?.body ?? ""), {
        type: "note",
        title: "Weekly plan",
      });
      assert.equal(calls[0]?.body.includes("visibility"), false);
      assert.equal(calls[0]?.body.includes("password"), false);
      assert.equal(calls[0]?.body.includes("emails"), false);
      assert.equal(calls[1]?.url, "/api/documents/doc-new");
      assert.equal(calls[1]?.method, "PATCH");
      assert.deepEqual(JSON.parse(calls[1]?.body ?? ""), { content: stored, version: 1 });
    } finally {
      globalThis.fetch = original;
    }
  });

  it("sends a named workspace and omits personal space", async () => {
    const original = globalThis.fetch;
    const bodies: string[] = [];
    globalThis.fetch = async (_input, init) => {
      if (String(init?.method) === "POST") bodies.push(String(init?.body ?? ""));
      if (String(init?.method) === "POST") return Response.json({ id: "doc-1" });
      return Response.json({ ok: true });
    };
    try {
      await importSharedNote("Plan", "Body", "ws-1");
      await importSharedNote("   ", "Body", PERSONAL_SPACE_ID);
      assert.deepEqual(JSON.parse(bodies[0] ?? ""), {
        type: "note",
        title: "Plan",
        workspaceId: "ws-1",
      });
      assert.deepEqual(JSON.parse(bodies[1] ?? ""), {
        type: "note",
        title: "Untitled note",
      });
    } finally {
      globalThis.fetch = original;
    }
  });

  it("deletes the created document when the content save fails", async () => {
    const original = globalThis.fetch;
    const methods: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const method = String(init?.method ?? "GET");
      methods.push(method);
      if (method === "POST") return Response.json({ id: "doc-orphan" });
      if (method === "PATCH") return Response.json({ error: "Title is too long" }, { status: 400 });
      return Response.json({ ok: true });
    };
    try {
      await assert.rejects(importSharedNote("Plan", "Body", "ws-1"), /Title is too long/);
      assert.deepEqual(methods, ["POST", "PATCH", "DELETE"]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("deletes the created document when the content save never returns", async () => {
    const original = globalThis.fetch;
    const calls: { url: string; method: string }[] = [];
    globalThis.fetch = async (input, init) => {
      const method = String(init?.method ?? "GET");
      calls.push({ url: String(input), method });
      if (method === "POST") return Response.json({ id: "doc-orphan" });
      if (method === "PATCH") throw new Error("network");
      return Response.json({ ok: true });
    };
    try {
      await assert.rejects(
        importSharedNote("Plan", "Body", "ws-1"),
        /Could not import this note\./,
      );
      assert.deepEqual(calls, [
        { url: "/api/documents", method: "POST" },
        { url: "/api/documents/doc-orphan", method: "PATCH" },
        { url: "/api/documents/doc-orphan", method: "DELETE" },
      ]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("does not delete a document when create fails", async () => {
    const original = globalThis.fetch;
    const methods: string[] = [];
    globalThis.fetch = async (_input, init) => {
      methods.push(String(init?.method ?? "GET"));
      return Response.json({ error: "Sign in required" }, { status: 401 });
    };
    try {
      await assert.rejects(importSharedNote("Plan", "Body", PERSONAL_SPACE_ID), /Sign in required/);
      assert.deepEqual(methods, ["POST"]);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("share menu import", () => {
  it("imports from the share actions into the selected workspace", () => {
    const share = read("../components/note/note-share-markdown.tsx");
    const panel = read("../components/note/note-import.tsx");
    const button = read("../components/note/note-import-button.tsx");
    const choice = read("../components/note/note-import-choice.tsx");
    const importer = read("./note-import.ts");

    assert.match(share, /<NoteImport readMarkdown=\{readMarkdown\} title=\{title\} \/>/);
    assert.equal(share.includes("workspacesQueryOptions"), false);
    assert.match(panel, /useQuery\(workspacesQueryOptions\(\)\)/);
    assert.match(panel, /librarySpaces\(workspaces\.data\)/);
    assert.match(panel, /<NoteImportChoice/);
    assert.match(panel, /<NoteImportButton/);
    assert.match(panel, /<Alert>/);
    assert.match(button, /importSharedNote\(title, readMarkdown\(\), workspaceId\)/);
    assert.match(button, /libraryItemsQueryKey/);
    assert.match(button, /router\.push\(`\/d\/\$\{id\}`\)/);
    assert.match(button, /Importing…/);
    assert.match(button, /mutation\.isPending/);
    assert.equal(button.includes("useState"), false);
    assert.equal(button.includes("noteExportMarkdown"), false);
    assert.match(choice, /<Form\.Context/);
    assert.match(choice, /<Form\.Select label="Workspace" name="workspaceId"/);
    assert.match(choice, /importSharedNote\(title, readMarkdown\(\), workspaceId\)/);
    assert.match(choice, /Importing…/);
    assert.equal(choice.includes("useState"), false);
    assert.equal(choice.includes("<select"), false);
    assert.equal(/visibility|password|emails/.test(importer), false);
  });
});
