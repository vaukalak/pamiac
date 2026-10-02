CREATE TABLE "agent_connect" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_name" text NOT NULL,
	"user_id" text,
	"token_id" text,
	"secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	CONSTRAINT "agent_connect_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "agent_connect_token_id_agent_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."agent_token"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX "agent_connect_expires_at_idx" ON "agent_connect" USING btree ("expires_at");
