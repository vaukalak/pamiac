ALTER TABLE "agent_token" ADD COLUMN "all_scopes" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_token" ADD COLUMN "workspace_ids" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
UPDATE "agent_token" SET "workspace_ids" = ARRAY['personal']::text[] WHERE "workspace_id" IS NULL;--> statement-breakpoint
UPDATE "agent_token" SET "workspace_ids" = ARRAY["workspace_id"]::text[] WHERE "workspace_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_token" DROP CONSTRAINT "agent_token_workspace_id_workspace_id_fk";--> statement-breakpoint
ALTER TABLE "agent_token" DROP COLUMN "workspace_id";
