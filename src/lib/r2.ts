import { createHash, createHmac } from "node:crypto";
import { HttpError } from "./http.ts";

const R2_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
] as const;

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

export function readR2Config(env: NodeJS.ProcessEnv = process.env): R2Config {
  const values = {
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID?.trim() ?? "",
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID?.trim() ?? "",
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY?.trim() ?? "",
    R2_BUCKET: env.R2_BUCKET?.trim() ?? "",
    R2_PUBLIC_BASE_URL: env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "") ?? "",
  };
  const missing = R2_ENV.filter((name) => !values[name]);
  if (missing.length > 0) {
    throw new HttpError(500, `Image storage is not configured. Missing ${missing.join(", ")}.`);
  }
  return {
    accountId: values.R2_ACCOUNT_ID,
    accessKeyId: values.R2_ACCESS_KEY_ID,
    secretAccessKey: values.R2_SECRET_ACCESS_KEY,
    bucket: values.R2_BUCKET,
    publicBaseUrl: values.R2_PUBLIC_BASE_URL,
  };
}

export type R2Put = {
  url: string;
  headers: Record<string, string>;
};

function sha256Hex(data: Uint8Array | string) {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function signingKey(secret: string, dateStamp: string) {
  const dateKey = hmac(`AWS4${secret}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function amzTimestamp(now: Date) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

export function r2PutRequest(
  config: R2Config,
  input: { key: string; body: Uint8Array; contentType: string; now: Date },
): R2Put {
  const amzDate = amzTimestamp(input.now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(input.body);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodePath(config.bucket)}/${encodePath(input.key)}`;
  const canonicalHeaders = [
    `content-type:${input.contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ]
    .map((line) => `${line}\n`)
    .join("");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(config.secretAccessKey, dateStamp))
    .update(stringToSign)
    .digest("hex");
  return {
    url: `https://${host}${canonicalUri}`,
    headers: {
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "content-type": input.contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  };
}

export async function putR2Object(
  config: R2Config,
  input: { key: string; bytes: Uint8Array; contentType: string; now?: Date },
  fetchImpl: typeof fetch = fetch,
) {
  const request = r2PutRequest(config, {
    key: input.key,
    body: input.bytes,
    contentType: input.contentType,
    now: input.now ?? new Date(),
  });
  const response = await fetchImpl(request.url, {
    method: "PUT",
    headers: request.headers,
    body: Buffer.from(input.bytes),
  });
  if (!response.ok) {
    throw new HttpError(502, "Could not store the image.");
  }
}
