CREATE TYPE "public"."direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'photo', 'video', 'document', 'voice', 'sticker', 'animation', 'location', 'contact');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_list" (
	"telegram_id" bigint PRIMARY KEY NOT NULL,
	"reason" text,
	"expires_at" timestamp with time zone,
	"added_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_maps" (
	"admin_message_id" bigint PRIMARY KEY NOT NULL,
	"user_telegram_id" bigint NOT NULL,
	"original_message_id" bigint,
	"media_group_id" varchar(100),
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_telegram_id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"direction" "direction" NOT NULL,
	"message_type" "message_type" NOT NULL,
	"content" text,
	"raw_data" jsonb,
	"media_group_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reply_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reply_templates_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"username" varchar(255),
	"is_blocked" boolean DEFAULT false NOT NULL,
	"last_notification_at" timestamp with time zone,
	"note" text,
	"first_message_at" timestamp with time zone,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_times" jsonb DEFAULT '[]'::jsonb,
	"rate_limit_level" integer DEFAULT 0 NOT NULL,
	"rate_limit_violations" integer DEFAULT 0 NOT NULL,
	"rate_limited_until" timestamp with time zone,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(64),
	"verification_expires_at" timestamp with time zone,
	"verification_attempts" integer DEFAULT 0 NOT NULL,
	"verification_last_attempt" timestamp with time zone,
	"verification_cooldown_until" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_maps" ADD CONSTRAINT "message_maps_user_telegram_id_users_id_fk" FOREIGN KEY ("user_telegram_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_user_telegram_id_users_id_fk" FOREIGN KEY ("user_telegram_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_telegram_id" ON "message_maps" USING btree ("user_telegram_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_user_idx" ON "messages" USING btree ("user_telegram_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_created_idx" ON "messages" USING btree ("created_at");