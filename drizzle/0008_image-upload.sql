CREATE TABLE "image_upload" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"document_id" text,
	"object_key" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_upload" ADD CONSTRAINT "image_upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_upload" ADD CONSTRAINT "image_upload_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "image_upload_object_key_idx" ON "image_upload" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "image_upload_user_created_idx" ON "image_upload" USING btree ("user_id","created_at");
