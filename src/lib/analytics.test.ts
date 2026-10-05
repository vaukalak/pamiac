import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { gunzipSync } from "node:zlib";
import { captureBrowserEvent } from "./analytics-browser.ts";
import {
  analyticsProperties,
  apiTokenCreatedEvent,
  captureNotificationCheckConfirmed,
  captureNotificationCheckTriggered,
  captureServerEvent,
  documentCreatedEvent,
  documentSavedEvent,
  folderCreatedEvent,
  imageUploadedEvent,
  noteNotificationSavedEvent,
  notificationCheckConfirmedEvent,
  notificationCheckTriggeredEvent,
  pageViewUrl,
  posthogBrowserOptions,
  posthogHost,
  posthogKey,
  shareUpdatedEvent,
  supportRequestSentEvent,
  workspaceCreatedEvent,
  workspaceInviteAcceptedEvent,
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

describe("onboarding and usage events", () => {
  it("names each event and keeps only ids and small enums", () => {
    const events = [
      workspaceCreatedEvent("user-1"),
      workspaceInviteAcceptedEvent("user-1"),
      apiTokenCreatedEvent("user-1"),
      documentCreatedEvent({ userId: "user-1", documentId: "doc-1", documentType: "note" }),
      documentSavedEvent({ userId: "user-1", documentId: "doc-1", documentType: "diagram" }),
      shareUpdatedEvent({ userId: "user-1", documentId: "doc-1", mode: "emails" }),
      folderCreatedEvent({ userId: "user-1", folderId: "folder-1" }),
      noteNotificationSavedEvent({ userId: "user-1", documentId: "doc-1", mode: "criteria" }),
      imageUploadedEvent({ userId: "user-1", documentId: "doc-1" }),
      supportRequestSentEvent("user-1"),
    ];
    assert.deepEqual(
      events.map((event) => event?.event),
      [
        "workspace_created",
        "workspace_invite_accepted",
        "api_token_created",
        "document_created",
        "document_saved",
        "share_updated",
        "folder_created",
        "note_notification_saved",
        "image_uploaded",
        "support_request_sent",
      ],
    );
    assert.deepEqual(events[3]?.properties, { documentId: "doc-1", documentType: "note" });
    assert.deepEqual(events[4]?.properties, { documentId: "doc-1", documentType: "diagram" });
    assert.deepEqual(events[5]?.properties, { documentId: "doc-1", mode: "emails" });
    assert.deepEqual(events[6]?.properties, { folderId: "folder-1" });
    assert.deepEqual(events[7]?.properties, { documentId: "doc-1", mode: "criteria" });
    assert.deepEqual(events[8]?.properties, { documentId: "doc-1" });
    assert.deepEqual(events[0]?.properties, {});
    assert.equal(events[9]?.distinctId, "user-1");
    assert.equal(supportRequestSentEvent(null).distinctId, "anonymous");
    assert.equal(supportRequestSentEvent("ada@example.com").distinctId, "anonymous");
    assert.deepEqual(supportRequestSentEvent("ada@example.com").properties, {});
    assert.equal(workspaceCreatedEvent("  "), null);
    assert.equal(workspaceCreatedEvent("ada@example.com"), null);
    assert.equal(
      documentCreatedEvent({ userId: "user-1", documentId: "doc-1", documentType: "other" }),
      null,
    );
    assert.equal(
      shareUpdatedEvent({ userId: "user-1", documentId: "doc-1", mode: "secret note" }),
      null,
    );
    assert.equal(
      noteNotificationSavedEvent({
        userId: "user-1",
        documentId: "doc-1",
        mode: "when the note mentions a name",
      }),
      null,
    );
    assert.equal(imageUploadedEvent({ userId: "user-1", documentId: null }), null);
    assert.equal(imageUploadedEvent({ userId: "user-1", documentId: "  " }), null);
  });

  it("drops email, content, and token properties before a capture", () => {
    const safe = analyticsProperties({
      documentId: "doc-1",
      email: "ada@example.com",
      content: "private note",
      token: "pam_secret",
      criteria: "mentions Ada",
      message: "help me",
      filename: "passport.png",
      password: "hunter2",
      title: "Diary",
      mode: "any",
    });
    assert.deepEqual(safe, { documentId: "doc-1", mode: "any" });
    const serialized = JSON.stringify(safe);
    assert.equal(serialized.includes("@"), false);
    assert.equal(serialized.includes("private note"), false);
    assert.equal(serialized.includes("pam_secret"), false);
    assert.equal(serialized.includes("passport"), false);
  });

  it("does not call the network for a usage event when the key is empty", async () => {
    const calls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return new Response("{}", { status: 200 });
    };
    try {
      await captureServerEvent(workspaceCreatedEvent("user-1"), { NEXT_PUBLIC_POSTHOG_KEY: "" });
      await captureServerEvent(apiTokenCreatedEvent("user-1"), {});
      await captureBrowserEvent("magic_link_requested");
    } finally {
      globalThis.fetch = original;
    }
    assert.deepEqual(calls, []);
  });

  it("leaves email, note text, and token values out of the request body", async () => {
    const bodies: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
      const body = init?.body;
      if (body && typeof body === "object" && "arrayBuffer" in body) {
        const bytes = Buffer.from(await body.arrayBuffer());
        bodies.push(gunzipSync(bytes).toString("utf8"));
      }
      return new Response("{}", { status: 200 });
    };
    try {
      await captureServerEvent(
        {
          distinctId: "ada@example.com",
          event: "document_saved",
          properties: {
            documentId: "doc-1",
            documentType: "note",
            email: "ada@example.com",
            content: "the private note",
            token: "pam_secret",
          },
        },
        { NEXT_PUBLIC_POSTHOG_KEY: "phc_test", NEXT_PUBLIC_POSTHOG_HOST: "https://example.test" },
      );
      await captureServerEvent(
        {
          distinctId: "user-1",
          event: "api_token_created",
          properties: {
            token: "pam_secret",
            documentId: "doc-1",
          },
        },
        { NEXT_PUBLIC_POSTHOG_KEY: "phc_test", NEXT_PUBLIC_POSTHOG_HOST: "https://example.test" },
      );
    } finally {
      globalThis.fetch = original;
    }

    assert.equal(bodies.length, 1);
    const payload = JSON.parse(bodies[0]) as {
      batch: Array<{ event: string; distinct_id: string; properties: Record<string, unknown> }>;
    };
    const sent = payload.batch[0];
    assert.equal(sent.event, "api_token_created");
    assert.equal(sent.distinct_id, "user-1");
    assert.deepEqual(sent.properties.documentId, "doc-1");
    const serialized = JSON.stringify(payload);
    assert.equal(serialized.includes("ada@example.com"), false);
    assert.equal(serialized.includes("private note"), false);
    assert.equal(serialized.includes("pam_secret"), false);
    assert.equal("token" in sent.properties, false);
    assert.equal("email" in sent.properties, false);
    assert.equal("content" in sent.properties, false);
  });

  it("still returns when a usage capture cannot reach PostHog", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("down");
    };
    try {
      await captureServerEvent(
        documentCreatedEvent({
          userId: "user-1",
          documentId: "doc-1",
          documentType: "note",
        }),
        {
          NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
          NEXT_PUBLIC_POSTHOG_HOST: "https://example.test",
        },
      );
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("onboarding and usage call sites", () => {
  it("fires browser events only after the sign-in step succeeds", () => {
    const magic = source("../components/login/login-magic-link-form.tsx");
    const password = source("../components/login/login-password-form.tsx");
    const google = source("../components/login/login-google.tsx");
    const browser = source("./analytics-browser.ts");
    const signIn = password.slice(
      password.indexOf("async function signInWithPassword"),
      password.indexOf("async function registerWithPassword"),
    );
    const register = password.slice(
      password.indexOf("async function registerWithPassword"),
      password.indexOf("async function submitPassword"),
    );

    assert.equal(browser.includes("posthog-node"), false);
    assert.match(browser, /import\("posthog-js"\)/);
    assert.equal(magic.includes("posthog-node"), false);
    assert.equal(password.includes("posthog-node"), false);
    assert.equal(google.includes("posthog-node"), false);

    const magicSend = magic.slice(
      magic.indexOf("async function sendMagicLink"),
      magic.indexOf("export function LoginMagicLinkForm"),
    );
    assert.ok(magicSend.indexOf("if (result.error)") < magicSend.indexOf("captureBrowserEvent"));
    assert.match(magicSend, /captureBrowserEvent\("magic_link_requested"\)/);
    const magicCapture = magicSend.slice(
      magicSend.indexOf("captureBrowserEvent"),
      magicSend.indexOf("rememberSentLoginAddress"),
    );
    assert.equal(magicCapture.includes("email"), false);
    assert.equal(magicCapture.includes("@"), false);

    assert.ok(signIn.indexOf("if (result.error)") < signIn.indexOf("captureBrowserEvent"));
    assert.match(signIn, /captureBrowserEvent\("password_sign_in"\)/);
    assert.equal(register.includes("captureBrowserEvent"), false);
    assert.equal(signIn.slice(signIn.indexOf("captureBrowserEvent")).includes("email"), false);

    const googleStart = google.slice(
      google.indexOf("async function startGoogleSignIn"),
      google.indexOf("export function LoginGoogle"),
    );
    assert.ok(
      googleStart.indexOf("if (result.error)") < googleStart.indexOf("captureBrowserEvent"),
    );
    assert.match(googleStart, /captureBrowserEvent\("google_sign_in_started"\)/);
    assert.equal(source("./auth.ts").includes("account_created"), false);
  });

  it("fires server events only after the write succeeds and leaves private text out", () => {
    const documents = source("./documents.ts");
    const workspaces = source("./workspaces.ts");
    const invites = source("./workspace-invites.ts");
    const folders = source("./folders.ts");
    const images = source("./image-upload.ts");
    const notes = source("./note-notify-run.ts");
    const support = source("../app/api/support/route.ts");

    const created = documents.slice(
      documents.indexOf("export async function createDocument"),
      documents.indexOf("export async function getOwnedDocument"),
    );
    const saved = documents.slice(
      documents.indexOf("export async function updateDocumentContent"),
      documents.indexOf("function documentInTokenScope"),
    );
    const share = documents.slice(
      documents.indexOf("export async function updateShare"),
      documents.indexOf("async function upsertEmbedding"),
    );
    const issued = documents.slice(
      documents.indexOf("export async function issueToken"),
      documents.indexOf("export async function updateToken"),
    );
    const updatedToken = documents.slice(
      documents.indexOf("export async function updateToken"),
      documents.indexOf("export async function revokeToken"),
    );
    const workspace = workspaces.slice(
      workspaces.indexOf("export async function createNamedWorkspace"),
      workspaces.indexOf("export async function renameWorkspace"),
    );
    const accept = invites.slice(
      invites.indexOf("export async function acceptWorkspaceInvite"),
      invites.indexOf("export async function rejectWorkspaceInvite"),
    );
    const folder = folders.slice(
      folders.indexOf("export async function createFolder"),
      folders.indexOf("export async function moveAgentDocumentToFolder"),
    );
    const savedNote = notes.slice(
      notes.indexOf("export async function saveNoteNotification"),
      notes.indexOf("async function postDecide"),
    );

    assert.ok(created.indexOf("throw new HttpError") < created.indexOf("documentCreatedEvent"));
    assert.ok(created.indexOf(".returning()") < created.indexOf("documentCreatedEvent"));
    assert.equal(created.match(/documentCreatedEvent/g)?.length, 1);
    assert.equal(saved.match(/documentSavedEvent/g)?.length, 1);
    assert.ok(saved.indexOf("return updated") > saved.indexOf("documentSavedEvent"));
    assert.ok(saved.indexOf(".returning()") < saved.indexOf("documentSavedEvent"));
    assert.ok(share.indexOf("shareUpdatedEvent") > share.indexOf("Could not send the note email"));
    const shareCapture = share.slice(share.indexOf("shareUpdatedEvent"), share.indexOf("return {"));
    assert.match(shareCapture, /mode: input\.visibility/);
    assert.equal(shareCapture.includes("email"), false);
    assert.equal(shareCapture.includes("password"), false);
    assert.ok(issued.indexOf(".insert(agentTokens)") < issued.indexOf("apiTokenCreatedEvent"));
    assert.match(issued, /apiTokenCreatedEvent\(userId\)/);
    const tokenCapture = issued.slice(
      issued.indexOf("apiTokenCreatedEvent"),
      issued.indexOf("return {"),
    );
    assert.equal(tokenCapture.includes("created.token"), false);
    assert.equal(tokenCapture.includes("secret"), false);
    assert.equal(updatedToken.includes("apiTokenCreatedEvent"), false);

    assert.ok(workspace.indexOf("workspaceCreatedEvent") > workspace.indexOf(".transaction"));
    assert.ok(accept.indexOf("workspaceInviteAcceptedEvent") > accept.indexOf(".delete"));
    assert.ok(folder.indexOf("folderCreatedEvent") > folder.indexOf(".returning"));
    assert.equal(folder.includes("nextName"), true);
    const folderCapture = folder.slice(folder.indexOf("folderCreatedEvent"));
    assert.equal(folderCapture.includes("nextName"), false);

    assert.ok(
      savedNote.indexOf("noteNotificationSavedEvent") > savedNote.indexOf("onConflictDoUpdate"),
    );
    const noteCapture = savedNote.slice(
      savedNote.indexOf("noteNotificationSavedEvent"),
      savedNote.indexOf("return {"),
    );
    assert.equal(noteCapture.includes("criteria"), false);

    const acceptImage = images.slice(images.indexOf("export async function acceptImageUpload"));
    assert.ok(
      acceptImage.indexOf("Document not found") < acceptImage.indexOf("imageUploadedEvent"),
    );
    assert.ok(acceptImage.indexOf("imageUploadedEvent") > acceptImage.indexOf("input.record"));
    assert.equal(acceptImage.match(/imageUploadedEvent/g)?.length, 1);
    const imageCapture = acceptImage.slice(
      acceptImage.indexOf("imageUploadedEvent"),
      acceptImage.indexOf("return { url }"),
    );
    assert.equal(imageCapture.includes("filename"), false);
    assert.equal(imageCapture.includes("bytes"), false);

    const accepted = support.slice(support.indexOf("export async function POST"));
    assert.ok(
      accepted.indexOf("await sendSupportRequest") < accepted.indexOf("supportRequestSentEvent"),
    );
    const supportCapture = accepted.slice(
      accepted.indexOf("supportRequestSentEvent"),
      accepted.indexOf("return json"),
    );
    assert.equal(supportCapture.includes("input.email"), false);
    assert.equal(supportCapture.includes("input.message"), false);
    assert.equal(supportCapture.includes("email"), false);
  });
});
