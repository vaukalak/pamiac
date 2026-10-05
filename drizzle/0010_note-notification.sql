CREATE TABLE "note_notification" (
	"document_id" text PRIMARY KEY NOT NULL,
	"mode" text DEFAULT 'never' NOT NULL,
	"criteria" text DEFAULT '' NOT NULL,
	"baseline_content" text,
	"latest_content" text,
	"due_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "note_notification" ADD CONSTRAINT "note_notification_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
