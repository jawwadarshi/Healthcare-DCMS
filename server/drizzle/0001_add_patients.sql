CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"gender" varchar(20) NOT NULL,
	"date_of_birth" date NOT NULL,
	"address" text NOT NULL,
	"medical_history" text NOT NULL,
	"allergies" text NOT NULL,
	"emergency_contact_name" varchar(255) NOT NULL,
	"emergency_contact_phone" varchar(30) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "patients" ADD CONSTRAINT "patients_created_by_users_id_fk"
 FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
 ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "patients_first_name_idx" ON "patients" ("first_name");
CREATE INDEX IF NOT EXISTS "patients_last_name_idx" ON "patients" ("last_name");
CREATE INDEX IF NOT EXISTS "patients_phone_idx" ON "patients" ("phone");
CREATE INDEX IF NOT EXISTS "patients_created_at_idx" ON "patients" ("created_at");
