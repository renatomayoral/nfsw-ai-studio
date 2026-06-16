CREATE TABLE "creator" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"handle" text,
	"bio" text,
	"avatar_url" text,
	"accent_color" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "creator_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "creator_link" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"platform" text NOT NULL,
	"label" text,
	"url" text NOT NULL,
	"sort_order" integer NOT NULL,
	"active" boolean NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_click" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"referrer" text,
	"country" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_link" ADD CONSTRAINT "creator_link_creator_id_creator_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_click" ADD CONSTRAINT "link_click_link_id_creator_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."creator_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_click" ADD CONSTRAINT "link_click_creator_id_creator_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "creator_user_idx" ON "creator" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creator_link_creator_idx" ON "creator_link" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "link_click_creator_created_idx" ON "link_click" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX "link_click_link_idx" ON "link_click" USING btree ("link_id");