import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { createPostHogClient } from "./posthog.ts";
import {
  posthogHost,
  posthogIdentifyCall,
  posthogLogoutEffect,
  posthogProjectToken,
  posthogSdkCallable,
} from "./posthog-identity.ts";

const originalToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

function restoreEnv() {
  if (originalToken === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  else process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = originalToken;
}

afterEach(() => {
  restoreEnv();
});

describe("posthogProjectToken", () => {
  it("returns null when the token is missing", () => {
    assert.equal(posthogProjectToken({}), null);
  });

  it("returns null when the token is blank", () => {
    assert.equal(posthogProjectToken({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "  \n" }), null);
  });
});

describe("posthogHost", () => {
  it("defaults to the US cloud when the host is unset", () => {
    assert.equal(posthogHost({}), "https://us.i.posthog.com");
  });

  it("uses an explicit host", () => {
    assert.equal(
      posthogHost({ NEXT_PUBLIC_POSTHOG_HOST: " https://eu.i.posthog.com " }),
      "https://eu.i.posthog.com",
    );
  });

  it("defaults when the host is blank", () => {
    assert.equal(posthogHost({ NEXT_PUBLIC_POSTHOG_HOST: " \n" }), "https://us.i.posthog.com");
  });
});

describe("posthogIdentifyCall", () => {
  it("identifies with the user id and stores email as a person property", () => {
    const call = posthogIdentifyCall({ id: "usr_123", email: "person@example.com" });
    assert.equal(call?.distinctId, "usr_123");
    assert.deepEqual(call?.properties, { email: "person@example.com" });
    assert.notEqual(call?.distinctId, "person@example.com");
  });

  it("does not identify when the user id is missing", () => {
    assert.equal(posthogIdentifyCall({ email: "person@example.com" }), null);
    assert.equal(posthogIdentifyCall({ id: "  ", email: "person@example.com" }), null);
    assert.equal(posthogIdentifyCall(null), null);
  });

  it("identifies the signed-in session user id from the root client", () => {
    const component = readFileSync(
      new URL("../components/posthog-identify.tsx", import.meta.url),
      "utf8",
    );
    assert.match(component, /session\.data\?\.user\.id/);
    assert.match(component, /identifySignedInUser\(\{ id: userId, email \}\)/);
    assert.doesNotMatch(component, /distinctId:\s*email/);
  });
});

describe("posthogLogoutEffect", () => {
  it("requests reset on logout", () => {
    assert.equal(posthogLogoutEffect(), "reset");
    const panel = readFileSync(
      new URL("../components/header/profile-menu-panel.tsx", import.meta.url),
      "utf8",
    );
    assert.match(panel, /if \(posthogLogoutEffect\(\) === "reset"\) resetPostHog\(\)/);
  });
});

describe("posthogSdkCallable", () => {
  it("refuses identify and reset when the SDK was not initialized", () => {
    assert.equal(posthogSdkCallable({ token: null, loaded: true }), false);
    assert.equal(posthogSdkCallable({ token: "phc_test", loaded: false }), false);
    assert.equal(posthogSdkCallable({ token: "phc_test", loaded: true }), true);
  });
});

describe("createPostHogClient", () => {
  it("returns null when the token is missing", () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    assert.equal(createPostHogClient(), null);
  });

  it("returns null when the token is blank", () => {
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = " \n";
    assert.equal(createPostHogClient(), null);
  });
});
