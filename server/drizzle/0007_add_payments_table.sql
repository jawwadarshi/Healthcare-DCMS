CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"visit_date" date NOT NULL,
	"rating" integer NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "duration_in_minutes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "base_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");