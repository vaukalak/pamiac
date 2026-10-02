INSERT INTO "user" ("id", "name", "email", "email_verified", "created_at", "updated_at")
VALUES ('user_openai_review', 'OpenAI Review', 'openaireview@pamiac.com', true, now(), now())
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
INSERT INTO "account" ("id", "account_id", "provider_id", "user_id", "password", "created_at", "updated_at")
SELECT 'account_openai_review', "user"."id", 'credential', "user"."id", 'e6fdb26abc223e27dc6c6c5a16c89577:52b16207644138b9d50f33e54e2cc239302ca1e9a88448a25e7bc12a103ccfbb219f5d769c29727096a6d08382fbbbf23a8b72b2e73d8a5970deb673f19cba1b', now(), now()
FROM "user"
WHERE "user"."email" = 'openaireview@pamiac.com'
  AND NOT EXISTS (
    SELECT 1
    FROM "account"
    WHERE "account"."user_id" = "user"."id"
      AND "account"."provider_id" = 'credential'
  );
