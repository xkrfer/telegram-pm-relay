CREATE TYPE "public"."verification_method" AS ENUM('none', 'math', 'quiz', 'turnstile', 'ai');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"verification" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_data" jsonb;--> statement-breakpoint
INSERT INTO "system_config" ("verification", "updated_at", "updated_by")
VALUES (
	'{"enabled": true, "method": "math", "timeout": 900}'::jsonb,
	now(),
	NULL
) ON CONFLICT DO NOTHING;