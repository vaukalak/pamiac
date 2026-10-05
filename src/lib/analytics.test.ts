import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { gunzipSync } from "node:zlib";
import {
  captureNotificationCheckConfirmed,
  captureNotificationCheckTriggered,
  notificationCheckConfirmedEvent,
  notificationCheckTriggeredEvent,
  pageViewUrl,
  posthogBrowserOptions,
  posthogHost,
  posthogKey,
} from "./analytics.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("notification check events", () => {
  it("records a start and a known answer without note text, criteria, or email", () => {
    const triggered = notificationCheckTriggeredEvent({
      documentId: "doc-1",
      source: "test",
      userId: "user-1",
    });
    const missed = notificationCheckConfirmedEvent({
      documentId: "doc-1",
      source: "delivery",
      userId: "user-1",
      result: false,
    });
    const verdict = notificationCheckConfirmedEvent({
      documentId: "doc-1",
      source: "test",
      userId: "user-1",
      result: "misses",
    });

    assert.equal(triggered?.event, "notification_check_triggered");
    assert.deepEqual(triggered?.properties, { documentId: "doc-1", source: "test" });
    assert.equal(triggered?.distinctId, "user-1");
    assert.equal(missed?.event, "notification_check_confirmed");
    assert.equal(missed?.properties.result, false);
    assert.equal(verdict?.properties.result, "misses");
    assert.equal(
      notificationCheckConfirmedEvent({
        documentId: "doc-1",
        source: "delivery",
        userId: "user-1",
        result: null,
      }),
      null,
    );
    assert.equal(
      notificationCheckConfirmedEvent({
        documentId: "doc-1",
        source: "test",
        userId: "user-1",
        result: "  ",
      }),
      null,
    );
    assert.equal(
      notificationCheckTriggeredEvent({
        documentId: "doc-1",
        source: "delivery",
        userId: "  ",
      }),
      null,
    );

    const serialized = JSON.stringify([
      triggered?.properties,
      missed?.properties,
      verdict?.properties,
    ]);
    assert.equal(serialized.includes("note"), false);
    assert.equal(serialized.includes("criteria"), false);
    assert.equal(serialized.includes("@"), false);
  });

  it("does not call the network when the key is missing", async () => {
    const calls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return new Response("{}", { status: 200 });
    };
    try {
      await captureNotificationCheckTriggered(
        { documentId: "doc-1", source: "test", userId: "user-1" },
        { NEXT_PUBLIC_POSTHOG_KEY: "  " },
      );
      await captureNotificationCheckConfirmed(
        { documentId: "doc-1", source: "delivery", userId: "user-1", result: false },
        {},
      );
    } finally {
      globalThis.fetch = original;
    }
    assert.deepEqual(calls, []);
    assert.equal(posthogKey({ NEXT_PUBLIC_POSTHOG_KEY: "" }), "");
    assert.equal(posthogHost({}), "https://us.i.posthog.com");
    assert.equal(
      notificationCheckTriggeredEvent({ documentId: "  ", source: "test", userId: "user-1" }),
      null,
    );
  });

  it("sends the known match to the configured host and leaves the note out of the body", async () => {
    const bodies: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const body = init?.body;
      if (body && typeof body === "object" && "arrayBuffer" in body) {
        const bytes = Buffer.from(await body.arrayBuffer());
        bodies.push(gunzipSync(bytes).toString("utf8"));
      }
      assert.equal(String(input), "https://example.test/batch/");
      return new Response("{}", { status: 200 });
    };
    try {
      await captureNotificationCheckConfirmed(
        {
          documentId: "doc-1",
          source: "delivery",
          userId: "user-1",
          result: true,
        },
        {
          NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
          NEXT_PUBLIC_POSTHOG_HOST: "https://example.test",
        },
      );
    } finally {
      globalThis.fetch = original;
    }

    assert.equal(bodies.length, 1);
    const payload = JSON.parse(bodies[0]) as {
      batch: Array<{ event: string; distinct_id: string; properties: Record<string, unknown> }>;
    };
    const sent = payload.batch[0];
    assert.equal(sent.event, "notification_check_confirmed");
    assert.equal(sent.distinct_id, "user-1");
    assert.equal(sent.properties.documentId, "doc-1");
    assert.equal(sent.properties.source, "delivery");
    assert.equal(sent.properties.result, true);
    const serialized = JSON.stringify(sent.properties);
    assert.equal(serialized.includes("note"), false);
    assert.equal(serialized.includes("criteria"), false);
    assert.equal(serialized.includes("@"), false);
  });

  it("returns without throwing when the capture request fails", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("down");
    };
    const started = Date.now();
    try {
      await captureNotificationCheckTriggered(
        { documentId: "doc-1", source: "test", userId: "user-1" },
        { NEXT_PUBLIC_POSTHOG_KEY: "phc_test", NEXT_PUBLIC_POSTHOG_HOST: "https://example.test" },
      );
    } finally {
      globalThis.fetch = original;
    }
    assert.ok(Date.now() - started < 1000);
  });
});

describe("browser page views", () => {
  it("keeps the route and drops an email from the query", () => {
    assert.equal(
      pageViewUrl("https://pamiac.com", "/d/doc-1", "view=raw&email=ada@example.com"),
      "https://pamiac.com/d/doc-1?view=raw",
    );
    assert.equal(
      pageViewUrl("https://pamiac.com", "/workspace", ""),
      "https://pamiac.com/workspace",
    );
    const options = posthogBrowserOptions("https://us.i.posthog.com");
    assert.equal(options.capture_pageview, false);
    assert.equal(options.autocapture, false);
    assert.equal(options.disable_session_recording, true);
  });

  it("initializes in a client provider and captures a pageview on the route", () => {
    const provider = source("../components/posthog-provider.tsx");
    const pageView = source("../components/posthog-page-view.tsx");
    const layout = source("../app/layout.tsx");

    assert.match(provider, /posthog\.init/);
    assert.match(provider, /posthog\.identify\(userId\)/);
    assert.equal(provider.includes("email"), false);
    assert.match(pageView, /capture\("\$pageview"/);
    assert.match(pageView, /usePathname/);
    assert.match(pageView, /useSearchParams/);
    assert.match(layout, /<PostHogProvider>/);
    assert.match(layout, /<PostHogPageView \/>/);
  });
});

describe("notification check call sites", () => {
  it("starts the check before the ask and confirms only after a known answer", () => {
    const run = source("./note-notify-run.ts");
    const delivery = run.slice(
      run.indexOf("async function sendCriteriaUpdate"),
      run.indexOf("async function sendNoteUpdateEmail"),
    );
    const test = run.slice(
      run.indexOf("export async function testNoteCriteria"),
      run.indexOf("async function deliverArmedNote"),
    );

    const deliveryCaptures = delivery.match(/captureNotificationCheck\w+\(\{[\s\S]*?\}\);/g) ?? [];
    const testCaptures = test.match(/captureNotificationCheck\w+\(\{[\s\S]*?\}\);/g) ?? [];

    assert.ok(
      delivery.indexOf("captureNotificationCheckTriggered") < delivery.indexOf("postDecide"),
    );
    assert.ok(
      delivery.indexOf("if (matched === null) return") <
        delivery.indexOf("captureNotificationCheckConfirmed"),
    );
    assert.equal(deliveryCaptures.length, 2);
    assert.match(delivery, /source: "delivery"/);

    assert.ok(test.indexOf("captureNotificationCheckTriggered") < test.indexOf("postDecide"));
    assert.ok(
      test.indexOf("if (!verdict) throw new HttpError") <
        test.indexOf("captureNotificationCheckConfirmed"),
    );
    assert.equal(testCaptures.length, 2);
    assert.match(test, /source: "test"/);

    for (const call of [...deliveryCaptures, ...testCaptures]) {
      assert.equal(call.includes("oldText"), false);
      assert.equal(call.includes("newText"), false);
      assert.equal(call.includes("criteria"), false);
      assert.equal(call.includes("content"), false);
      assert.equal(call.includes("email"), false);
    }
  });
});
