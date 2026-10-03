ALTER TABLE "folder" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "password_hash" text;--> statement-breakpoint
CREATE TABLE "folder_share" (
	"id" text PRIMARY KEY NOT NULL,
	"folder_id" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "folder_share" ADD CONSTRAINT "folder_share_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "folder_share_email_idx" ON "folder_share" USING btree ("folder_id","email");
