CREATE TABLE "document_permission_request" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_permission_request" ADD CONSTRAINT "document_permission_request_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_permission_request" ADD CONSTRAINT "document_permission_request_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_permission_request_document_requester_idx" ON "document_permission_request" USING btree ("document_id","requester_id");
