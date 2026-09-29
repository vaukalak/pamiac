import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { focusManager, QueryObserver } from "@tanstack/react-query";
import { fetchLibraryItems, libraryItemsQueryOptions } from "./library-items.ts";
import { createQueryClient } from "./query-client.ts";

async function nextTicks() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("library items refetch when the page is focused", () => {
  it("keeps queries stale so window focus can refetch them", () => {
    const defaults = createQueryClient().getDefaultOptions().queries;
    assert.equal(defaults?.refetchOnWindowFocus, true);
    assert.equal(defaults?.staleTime, 0);
  });

  it("configures the items query to refetch on window focus", () => {
    const options = libraryItemsQueryOptions();
    assert.deepEqual(options.queryKey, ["library", "items"]);
    assert.equal(options.refetchOnWindowFocus, true);
    assert.equal(options.staleTime, 0);
  });

  it("refetches stale library items when the window gains focus", async () => {
    const client = createQueryClient();
    client.mount();
    focusManager.setFocused(false);
    let calls = 0;
    const observer = new QueryObserver(client, {
      ...libraryItemsQueryOptions(),
      queryFn: async () => {
        calls += 1;
        return [];
      },
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      await observer.refetch();
      assert.equal(calls, 1);
      focusManager.setFocused(true);
      await nextTicks();
      assert.equal(calls, 2);
    } finally {
      unsubscribe();
      client.unmount();
      focusManager.setFocused(undefined);
    }
  });

  it("skips the focus refetch while items are still fresh", async () => {
    const client = createQueryClient();
    client.mount();
    focusManager.setFocused(false);
    let calls = 0;
    const observer = new QueryObserver(client, {
      ...libraryItemsQueryOptions(),
      staleTime: 60_000,
      queryFn: async () => {
        calls += 1;
        return [];
      },
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      await observer.refetch();
      assert.equal(calls, 1);
      focusManager.setFocused(true);
      await nextTicks();
      assert.equal(calls, 1);
    } finally {
      unsubscribe();
      client.unmount();
      focusManager.setFocused(undefined);
    }
  });

  it("rejects a library response that is not a document list", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ documents: null });
    try {
      await assert.rejects(fetchLibraryItems(), /Could not load the library/);
    } finally {
      globalThis.fetch = original;
    }
  });
});
