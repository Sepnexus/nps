ALTER TABLE "transactions" ADD COLUMN "is_flat_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "flat_share_pct" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "openai_api_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "openai_model" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "openai_vision_model" varchar(64);