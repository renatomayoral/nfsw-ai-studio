ALTER TABLE "creator" RENAME COLUMN "telegram_bot_token" TO "telegram_channel_id";
ALTER TABLE "creator" ADD COLUMN "telegram_channel_title" text;
