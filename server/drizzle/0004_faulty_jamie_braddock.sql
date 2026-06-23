ALTER TABLE "appointments" DROP CONSTRAINT "appointments_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;