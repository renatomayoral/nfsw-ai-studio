ALTER TABLE "creator" ALTER COLUMN "platform_fee_pct" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vip_plan_price" ALTER COLUMN "active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vip_plan_price" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vip_plan_price" ADD COLUMN "nowpayments_plans_id" text;