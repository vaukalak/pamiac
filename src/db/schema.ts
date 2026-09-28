import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";
import { EMBEDDING_DIMENSIONS } from "../lib/embeddings";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const documents = pgTable(
  "document",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["note", "diagram"] }).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    visibility: text("visibility", { enum: ["private", "public", "password", "emails"] })
      .notNull()
      .default("private"),
    passwordHash: text("password_hash"),
    sortIndex: integer("sort_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("document_owner_idx").on(table.ownerId, table.sortIndex)],
);

export const documentShares = pgTable(
  "document_share",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
  },
  (table) => [uniqueIndex("document_share_email_idx").on(table.documentId, table.email)],
);

export const documentEmbeddings = pgTable(
  "document_embedding",
  {
    documentId: text("document_id")
      .primaryKey()
      .references(() => documents.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("document_embedding_cosine_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);

export const agentTokens = pgTable(
  "agent_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    tokenPrefix: text("token_prefix").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [index("agent_token_user_idx").on(table.userId)],
);

export const devMagicLinks = pgTable("dev_magic_link", {
  email: text("email").primaryKey(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
