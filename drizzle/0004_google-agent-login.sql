CREATE TABLE "agent_google_login" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code_hash" text NOT NULL,
	"user_code_hash" text NOT NULL,
	"agent_name" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"denied_at" timestamp with time zone,
	"user_id" text,
	"token_secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_google_login_device_code_hash_unique" UNIQUE("device_code_hash"),
	CONSTRAINT "agent_google_login_user_code_hash_unique" UNIQUE("user_code_hash")
);
--> statement-breakpoint
ALTER TABLE "agent_google_login" ADD CONSTRAINT "agent_google_login_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
