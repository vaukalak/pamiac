import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { HttpError } from "./http.ts";
import {
  acceptImageUpload,
  IMAGE_CAP_ERROR,
  IMAGE_CONFIG_ERROR,
  IMAGE_TYPE_ERROR,
  imageBytesThisMonth,
  imageObjectKey,
  imagePublicUrl,
  imageRequestTooLarge,
  imageUploadFits,
  MONTHLY_IMAGE_BYTE_CAP,
  resolveImageType,
  utcMonthWindow,
  type ImageUsageRow,
  type StoredImage,
} from "./image-upload.ts";
import {
  getR2Object,
  putR2Object,
  readR2Config,
  r2GetRequest,
  r2PutRequest,
  type R2Config,
} from "./r2.ts";
import {
  imageObjectContentType,
  isImageObjectKey,
  rewriteStoredR2Images,
} from "./stored-image-url.ts";

const NOW = new Date("2026-10-03T12:00:00.000Z");
const CAP = MONTHLY_IMAGE_BYTE_CAP;

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0x00]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GIF = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

function row(userId: string, byteSize: number, createdAt: string): ImageUsageRow {
  return { userId, byteSize, createdAt: new Date(createdAt) };
}

function jpegOf(size: number) {
  const bytes = new Uint8Array(size);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

function usage(userId: string) {
  return [
    row(userId, 1024, "2026-09-30T23:59:59.999Z"),
    row(userId, 2048, "2026-10-01T00:00:00.000Z"),
    row(userId, 4096, "2026-10-15T00:00:00.000Z"),
    row("someone-else", CAP, "2026-10-02T00:00:00.000Z"),
    row(userId, 8192, "2026-11-01T00:00:00.000Z"),
  ];
}

describe("monthly image quota", () => {
  it("counts this user's bytes inside the UTC month and ignores other months and users", () => {
    const used = imageBytesThisMonth(usage("ada"), "ada", NOW);
    assert.equal(used, 2048 + 4096);
    assert.equal(imageUploadFits(used, CAP - used), true);
    assert.equal(imageUploadFits(0, CAP), true);
    assert.equal(imageUploadFits(0, CAP + 1), false);
    assert.equal(imageUploadFits(CAP, 1), false);
    assert.equal(imageUploadFits(CAP - 1, 1), true);
  });

  it("opens the window at UTC month start and closes it at the next month", () => {
    const window = utcMonthWindow(NOW);
    assert.equal(window.start.toISOString(), "2026-10-01T00:00:00.000Z");
    assert.equal(window.end.toISOString(), "2026-11-01T00:00:00.000Z");
    assert.equal(imageBytesThisMonth([row("ada", 10, window.start.toISOString())], "ada", NOW), 10);
    assert.equal(imageBytesThisMonth([row("ada", 10, window.end.toISOString())], "ada", NOW), 0);
  });

  it("rolls the window into the next year", () => {
    const now = new Date("2026-12-31T23:59:59.000Z");
    const window = utcMonthWindow(now);
    assert.equal(window.start.toISOString(), "2026-12-01T00:00:00.000Z");
    assert.equal(window.end.toISOString(), "2027-01-01T00:00:00.000Z");
    assert.equal(imageBytesThisMonth([row("ada", 5, "2026-12-01T00:00:00.000Z")], "ada", now), 5);
    assert.equal(imageBytesThisMonth([row("ada", 5, "2027-01-01T00:00:00.000Z")], "ada", now), 0);
  });
});

describe("image upload acceptance", () => {
  const base = "https://images.example";

  async function accept(overrides: Partial<Parameters<typeof acceptImageUpload>[0]> = {}) {
    const stored: StoredImage[] = [];
    const puts: { key: string; contentType: string; bytes: number }[] = [];
    const result = await acceptImageUpload({
      userId: "ada",
      documentId: "note-1",
      bytes: JPEG,
      declaredType: "image/jpeg",
      usedBytes: 0,
      publicBaseUrl: base,
      key: "abc123.jpg",
      putObject: async (object) => {
        puts.push({
          key: object.key,
          contentType: object.contentType,
          bytes: object.bytes.byteLength,
        });
      },
      record: async (row) => {
        stored.push(row);
      },
      ...overrides,
    });
    return { result, stored, puts };
  }

  it("accepts jpeg, png, webp, and gif and rejects other bytes", () => {
    assert.equal(resolveImageType(JPEG, "image/jpeg")?.contentType, "image/jpeg");
    assert.equal(resolveImageType(JPEG, "image/jpg")?.extension, "jpg");
    assert.equal(resolveImageType(PNG, "image/png")?.contentType, "image/png");
    assert.equal(resolveImageType(WEBP, "image/webp")?.contentType, "image/webp");
    assert.equal(resolveImageType(GIF, "image/gif")?.contentType, "image/gif");
    assert.equal(
      resolveImageType(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), "image/gif")
        ?.contentType,
      "image/gif",
    );
    assert.equal(resolveImageType(JPEG, "image/pjpeg")?.contentType, "image/jpeg");
    assert.equal(resolveImageType(JPEG, "image/jpeg; charset=binary")?.contentType, "image/jpeg");
    assert.equal(resolveImageType(PNG, "application/octet-stream")?.contentType, "image/png");
    assert.equal(
      resolveImageType(Uint8Array.from([0x3c, 0x73, 0x76, 0x67]), "image/svg+xml"),
      null,
    );
    assert.equal(
      resolveImageType(
        Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]),
        "image/webp",
      ),
      null,
    );
    assert.equal(resolveImageType(JPEG, "image/png"), null);
    assert.equal(resolveImageType(PNG, "")?.contentType, "image/png");
  });

  it("allows a file that lands on 50 MB and rejects one byte past it", async () => {
    const used = imageBytesThisMonth(
      [row("ada", CAP, "2026-09-15T00:00:00.000Z"), row("grace", CAP, "2026-10-15T00:00:00.000Z")],
      "ada",
      NOW,
    );
    assert.equal(used, 0);
    const exact = await accept({ bytes: jpegOf(CAP), usedBytes: used });
    assert.equal(exact.result.url, "https://images.example/abc123.jpg");
    assert.equal(exact.stored[0]?.byteSize, CAP);
    await assert.rejects(
      () => accept({ bytes: jpegOf(CAP), usedBytes: 1 }),
      (error: unknown) => error instanceof HttpError && error.status === 413,
    );
    await assert.rejects(
      () => accept({ bytes: jpegOf(3), usedBytes: CAP - 2 }),
      (error: unknown) => error instanceof HttpError && error.message === IMAGE_CAP_ERROR,
    );
  });

  it("stores a public url for an allowed image under the cap", async () => {
    const { result, stored, puts } = await accept({ usedBytes: CAP - JPEG.byteLength });
    assert.equal(result.url, "https://images.example/abc123.jpg");
    assert.deepEqual(puts, [
      { key: "abc123.jpg", contentType: "image/jpeg", bytes: JPEG.byteLength },
    ]);
    assert.equal(stored[0]?.byteSize, JPEG.byteLength);
    assert.equal(stored[0]?.documentId, "note-1");
    assert.equal(stored[0]?.userId, "ada");
  });

  it("rejects one byte over the cap before storing anything", async () => {
    const stored: StoredImage[] = [];
    await assert.rejects(
      () =>
        accept({
          usedBytes: CAP - JPEG.byteLength + 1,
          record: async (row) => {
            stored.push(row);
          },
          putObject: async () => {
            throw new Error("put should not run");
          },
        }),
      (error: unknown) =>
        error instanceof HttpError && error.status === 413 && error.message === IMAGE_CAP_ERROR,
    );
    assert.equal(stored.length, 0);
  });

  it("rejects a signed-out caller, a missing document, a bad type, and missing storage config", async () => {
    let puts = 0;
    let records = 0;
    const track = {
      putObject: async () => {
        puts += 1;
      },
      record: async () => {
        records += 1;
      },
    };
    await assert.rejects(
      () => accept({ userId: null, ...track }),
      (error: unknown) => {
        return error instanceof HttpError && error.status === 401;
      },
    );
    await assert.rejects(
      () => accept({ documentId: null, ...track }),
      (error: unknown) => {
        return error instanceof HttpError && error.status === 404;
      },
    );
    await assert.rejects(
      () => accept({ bytes: Uint8Array.from([1, 2, 3]), declaredType: "text/plain", ...track }),
      (error: unknown) =>
        error instanceof HttpError && error.status === 400 && error.message === IMAGE_TYPE_ERROR,
    );
    await assert.rejects(
      () => accept({ publicBaseUrl: "  ", ...track }),
      (error: unknown) =>
        error instanceof HttpError && error.status === 500 && error.message === IMAGE_CONFIG_ERROR,
    );
    assert.equal(puts, 0);
    assert.equal(records, 0);
  });

  it("does not record a row when object storage fails", async () => {
    const stored: StoredImage[] = [];
    await assert.rejects(
      () =>
        accept({
          record: async (row) => {
            stored.push(row);
          },
          putObject: async () => {
            throw new HttpError(502, "Could not store the image.");
          },
        }),
      (error: unknown) => error instanceof HttpError && error.status === 502,
    );
    assert.equal(stored.length, 0);
  });

  it("builds an unguessable key and a public url without the original filename", () => {
    const key = imageObjectKey("png", () =>
      Uint8Array.from(Array.from({ length: 16 }, () => 0xab)),
    );
    assert.equal(key, `${"ab".repeat(16)}.png`);
    assert.equal(key.includes("holiday"), false);
    const generated = imageObjectKey("gif");
    assert.match(generated, /^[0-9a-f]{32}\.gif$/);
    assert.notEqual(generated, imageObjectKey("gif"));
    assert.equal(imagePublicUrl("https://cdn.example/", key), `https://cdn.example/${key}`);
    assert.equal(
      imagePublicUrl(
        "https://387cdb1c68988ce1812f67c510b491a3.r2.cloudflarestorage.com",
        "91c3de96f8fef51134e8ee697c17e07f.jpg",
      ),
      "/i/91c3de96f8fef51134e8ee697c17e07f.jpg",
    );
    assert.equal(
      imagePublicUrl("https://pub-abc.r2.dev/", "91c3de96f8fef51134e8ee697c17e07f.jpg"),
      "https://pub-abc.r2.dev/91c3de96f8fef51134e8ee697c17e07f.jpg",
    );
  });

  it("treats an advertised body over the monthly cap as too large", () => {
    assert.equal(imageRequestTooLarge(String(CAP + 64 * 1024)), false);
    assert.equal(imageRequestTooLarge(String(CAP + 64 * 1024 + 1)), true);
    assert.equal(imageRequestTooLarge(null), false);
  });
});

describe("r2 client", () => {
  const config: R2Config = {
    accountId: "account",
    accessKeyId: "key",
    secretAccessKey: "secret",
    bucket: "notes",
    publicBaseUrl: "https://images.example",
  };

  it("names missing settings and does not require them until upload", () => {
    assert.throws(
      () => readR2Config({}),
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 500 &&
        error.message.includes("R2_ACCOUNT_ID") &&
        error.message.includes("R2_PUBLIC_BASE_URL"),
    );
    const read = readR2Config({
      R2_ACCOUNT_ID: "account",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_BUCKET: "notes",
      R2_PUBLIC_BASE_URL: "https://images.example/",
    });
    assert.equal(read.publicBaseUrl, "https://images.example");
  });

  it("signs a put to the bucket key and leaves the public url separate", () => {
    const first = r2PutRequest(config, {
      key: "abc123.jpg",
      body: JPEG,
      contentType: "image/jpeg",
      now: NOW,
    });
    const second = r2PutRequest(config, {
      key: "abc123.jpg",
      body: JPEG,
      contentType: "image/jpeg",
      now: NOW,
    });
    const changed = r2PutRequest(config, {
      key: "abc123.jpg",
      body: PNG,
      contentType: "image/jpeg",
      now: NOW,
    });
    assert.equal(first.url, "https://account.r2.cloudflarestorage.com/notes/abc123.jpg");
    assert.equal(first.headers.authorization, second.headers.authorization);
    assert.notEqual(first.headers.authorization, changed.headers.authorization);
    assert.match(first.headers.authorization, /Credential=key\/20261003\/auto\/s3\/aws4_request/);
    assert.equal(first.headers.authorization.includes("secret"), false);
    assert.equal(first.url.includes("holiday photo"), false);
  });

  it("turns a failed put into a storage error and skips the network when fetch is replaced", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        putR2Object(
          config,
          { key: "abc123.jpg", bytes: JPEG, contentType: "image/jpeg", now: NOW },
          async () => {
            calls += 1;
            return new Response("denied", { status: 403 });
          },
        ),
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 502 &&
        error.message === "Could not store the image.",
    );
    assert.equal(calls, 1);
    const seen: { url: string; method: string }[] = [];
    await putR2Object(
      config,
      { key: "abc123.jpg", bytes: JPEG, contentType: "image/jpeg", now: NOW },
      async (url, init) => {
        seen.push({ url: String(url), method: init?.method ?? "" });
        return new Response(null, { status: 200 });
      },
    );
    assert.deepEqual(seen, [
      { url: "https://account.r2.cloudflarestorage.com/notes/abc123.jpg", method: "PUT" },
    ]);
  });

  it("signs a get for the bucket key without putting the secret in the url", () => {
    const key = "91c3de96f8fef51134e8ee697c17e07f.jpg";
    const first = r2GetRequest(config, { key, now: NOW });
    const second = r2GetRequest(config, { key, now: NOW });
    const changed = r2GetRequest(config, { key: "ab".repeat(16) + ".png", now: NOW });
    assert.equal(first.url, `https://account.r2.cloudflarestorage.com/notes/${key}`);
    assert.equal(first.url.includes("secret"), false);
    assert.equal(first.headers.authorization.includes("secret"), false);
    assert.match(first.headers.authorization, /^AWS4-HMAC-SHA256 /);
    assert.match(first.headers.authorization, /Credential=key\/20261003\/auto\/s3\/aws4_request/);
    assert.equal(first.headers.authorization, second.headers.authorization);
    assert.notEqual(first.headers.authorization, changed.headers.authorization);
    assert.equal(
      first.headers["x-amz-content-sha256"],
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("returns object bytes from a signed get and treats 404 as missing", async () => {
    const seen: { url: string; method: string; authorization: string }[] = [];
    const loaded = await getR2Object(config, { key: "abc123.jpg", now: NOW }, async (url, init) => {
      seen.push({
        url: String(url),
        method: init?.method ?? "",
        authorization: new Headers(init?.headers).get("authorization") ?? "",
      });
      return new Response(Uint8Array.from([1, 2, 3]), { status: 200 });
    });
    assert.deepEqual(loaded?.bytes, Uint8Array.from([1, 2, 3]));
    assert.equal(seen[0]?.method, "GET");
    assert.equal(seen[0]?.url, "https://account.r2.cloudflarestorage.com/notes/abc123.jpg");
    assert.match(seen[0]?.authorization ?? "", /AWS4-HMAC-SHA256/);
    assert.equal(seen[0]?.url.includes("secret"), false);
    assert.equal(
      await getR2Object(config, { key: "abc123.jpg", now: NOW }, async () => {
        return new Response("missing", { status: 404 });
      }),
      null,
    );
    await assert.rejects(
      () =>
        getR2Object(config, { key: "abc123.jpg", now: NOW }, async () => {
          return new Response("denied", { status: 403 });
        }),
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 502 &&
        error.message === "Could not load the image.",
    );
  });
});

describe("stored r2 image urls", () => {
  const key = "91c3de96f8fef51134e8ee697c17e07f.jpg";
  const host = "https://387cdb1c68988ce1812f67c510b491a3.r2.cloudflarestorage.com";

  it("accepts only a 32 hex object key with an image extension", () => {
    assert.equal(isImageObjectKey(key), true);
    assert.equal(isImageObjectKey("ab".repeat(16) + ".png"), true);
    assert.equal(isImageObjectKey("ab".repeat(16) + ".webp"), true);
    assert.equal(isImageObjectKey("ab".repeat(16) + ".gif"), true);
    assert.equal(isImageObjectKey("ab".repeat(16) + ".svg"), false);
    assert.equal(isImageObjectKey("ab".repeat(15) + ".jpg"), false);
    assert.equal(isImageObjectKey(`${key}/../../secret`), false);
    assert.equal(isImageObjectKey("../etc/passwd"), false);
    assert.equal(isImageObjectKey(`notes/${key}`), false);
    assert.equal(isImageObjectKey(key.toUpperCase()), false);
  });

  it("rewrites s3 image urls with or without a bucket segment and leaves other hosts", () => {
    assert.equal(rewriteStoredR2Images(`${host}/${key}`), `/i/${key}`);
    assert.equal(rewriteStoredR2Images(`![shot](${host}/notes/${key})`), `![shot](/i/${key})`);
    const other = `https://cdn.example/${key} and https://images.example.com/file.jpg`;
    assert.equal(rewriteStoredR2Images(other), other);
    assert.equal(
      rewriteStoredR2Images(`https://pub-abc.r2.dev/${key}`),
      `https://pub-abc.r2.dev/${key}`,
    );
    assert.equal(
      rewriteStoredR2Images(`http://${host.slice("https://".length)}/${key}`),
      `http://${host.slice("https://".length)}/${key}`,
    );
    assert.equal(
      rewriteStoredR2Images(`${host}/folder/notes/${key}`),
      `${host}/folder/notes/${key}`,
    );
    assert.equal(
      rewriteStoredR2Images(`https://cdn.example/r2.cloudflarestorage.com/${key}`),
      `https://cdn.example/r2.cloudflarestorage.com/${key}`,
    );
    assert.equal(rewriteStoredR2Images(`${host}/${key}?X-Amz-Signature=secret`), `/i/${key}`);
    assert.equal(rewriteStoredR2Images(rewriteStoredR2Images(`${host}/${key}`)), `/i/${key}`);
    assert.equal(rewriteStoredR2Images(`See ${host}/${key}.`), `See /i/${key}.`);
    assert.equal(imageObjectContentType(key), "image/jpeg");
    assert.equal(imageObjectContentType("ab".repeat(16) + ".svg"), null);
    assert.equal(imagePublicUrl(`${host}/`, key), `/i/${key}`);
    assert.equal(
      imagePublicUrl("https://images.example.com", key),
      `https://images.example.com/${key}`,
    );
  });

  it("serves only an allowlisted key from the signed reader", () => {
    const route = readFileSync(new URL("../app/i/[key]/route.ts", import.meta.url), "utf8");
    assert.match(route, /imageObjectContentType\(key\)/);
    assert.match(route, /getR2Object\(readR2Config\(\), \{ key \}\)/);
    assert.match(route, /cache-control": "public, max-age=31536000, immutable"/);
    assert.match(route, /status: 404/);
    assert.equal(route.includes("requireLibraryUser"), false);
    assert.equal(route.includes("getLibrarySession"), false);
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    const editor = readFileSync(
      new URL("../components/document/note-document.tsx", import.meta.url),
      "utf8",
    );
    const publicNote = readFileSync(
      new URL("../components/public-note/public-note.tsx", import.meta.url),
      "utf8",
    );
    assert.match(page, /rewriteStoredR2Images\(bundle\.document\.content\)/);
    assert.match(editor, /rewriteStoredR2Images\(content\)/);
    assert.match(editor, /rewriteStoredR2Images\(document\.content\)/);
    assert.match(publicNote, /rewriteStoredR2Images\(markdown\)/);
  });
});

describe("note image wiring", () => {
  function read(path: string) {
    return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  }

  it("uploads through the editor for an editable document and locks the monthly total", () => {
    const editor = read("src/components/note-editor.tsx");
    const note = read("src/components/document/note-document.tsx");
    const route = read("src/app/api/documents/[id]/images/route.ts");
    const store = read("src/lib/note-image.ts");
    const schema = read("src/db/schema.ts");
    const migration = read("drizzle/0008_image-upload.sql");
    const journal = read("drizzle/meta/_journal.json");
    const env = read(".env.example");

    assert.match(note, /<NoteEditor[\s\S]*id=\{id\}/);
    assert.match(editor, /uploadFile:/);
    assert.match(editor, /\/api\/documents\/\$\{documentId\}\/images/);
    assert.match(editor, /useMutation/);
    assert.match(route, /uploadNoteImage/);
    assert.match(route, /form\.get\("file"\)/);
    assert.match(store, /requireLibraryUser/);
    assert.match(store, /getEditableDocument/);
    const transactionAt = store.indexOf("getDb().transaction");
    const lockAt = store.indexOf("pg_advisory_xact_lock");
    const usedAt = store.indexOf("await usedImageBytes");
    const acceptAt = store.indexOf("return acceptImageUpload");
    assert.ok(transactionAt < lockAt && lockAt < usedAt && usedAt < acceptAt);
    assert.match(store, /pg_advisory_xact_lock/);
    assert.match(store, /acceptImageUpload/);
    assert.match(store, /putR2Object/);
    assert.match(store, /utcMonthWindow/);
    assert.doesNotMatch(store, /vercel/);
    assert.match(schema, /image_upload/);
    assert.match(schema, /onDelete: "set null"/);
    assert.match(migration, /CREATE TABLE "image_upload"/);
    assert.match(migration, /ON DELETE set null/);
    assert.match(journal, /"tag": "0008_image-upload"/);
    assert.match(env, /R2_ACCOUNT_ID=/);
    assert.match(env, /R2_ACCESS_KEY_ID=/);
    assert.match(env, /R2_SECRET_ACCESS_KEY=/);
    assert.match(env, /R2_BUCKET=/);
    assert.match(env, /R2_PUBLIC_BASE_URL=/);
  });
});
