CREATE TYPE "public"."accounting_provider" AS ENUM('xero', 'quickbooks', 'fortnox');--> statement-breakpoint
CREATE TYPE "public"."accounting_sync_status" AS ENUM('synced', 'failed', 'pending', 'partial');--> statement-breakpoint
CREATE TYPE "public"."accounting_sync_type" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."inbox_blocklist_type" AS ENUM('email', 'domain');--> statement-breakpoint
CREATE TYPE "public"."insight_period_type" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."insight_status" AS ENUM('pending', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."invoice_recurring_end_type" AS ENUM('never', 'on_date', 'after_count');--> statement-breakpoint
CREATE TYPE "public"."invoice_recurring_frequency" AS ENUM('weekly', 'biweekly', 'monthly_date', 'monthly_weekday', 'monthly_last_day', 'quarterly', 'semi_annual', 'annual', 'custom');--> statement-breakpoint
CREATE TYPE "public"."invoice_recurring_status" AS ENUM('active', 'paused', 'completed', 'canceled');--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'invoice_refunded' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'recurring_series_started' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'recurring_series_completed' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'recurring_series_paused' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'recurring_invoice_upcoming' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'insight_ready';--> statement-breakpoint
ALTER TYPE "public"."inbox_status" ADD VALUE 'other';--> statement-breakpoint
ALTER TYPE "public"."inbox_type" ADD VALUE 'other';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'refunded';--> statement-breakpoint
ALTER TYPE "public"."reportTypes" ADD VALUE 'monthly_revenue';--> statement-breakpoint
ALTER TYPE "public"."reportTypes" ADD VALUE 'revenue_forecast';--> statement-breakpoint
ALTER TYPE "public"."reportTypes" ADD VALUE 'runway';--> statement-breakpoint
ALTER TYPE "public"."reportTypes" ADD VALUE 'category_expenses';--> statement-breakpoint
ALTER TYPE "public"."transactionStatus" ADD VALUE 'exported';--> statement-breakpoint
CREATE TABLE "accounting_sync_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"provider" "accounting_provider" NOT NULL,
	"provider_tenant_id" text NOT NULL,
	"provider_transaction_id" text,
	"synced_attachment_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sync_type" "accounting_sync_type",
	"status" "accounting_sync_status" DEFAULT 'synced' NOT NULL,
	"error_message" text,
	"error_code" text,
	"provider_entity_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_sync_records_transaction_provider_key" UNIQUE("transaction_id","provider")
);
--> statement-breakpoint
ALTER TABLE "accounting_sync_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inbox_blocklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"type" "inbox_blocklist_type" NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "inbox_blocklist_team_id_type_value_key" UNIQUE("team_id","type","value")
);
--> statement-breakpoint
ALTER TABLE "inbox_blocklist" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "insight_user_status" (
	"insight_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insight_user_status_insight_id_user_id_pk" PRIMARY KEY("insight_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "insight_user_status" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"period_type" "insight_period_type" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"period_year" smallint NOT NULL,
	"period_number" smallint NOT NULL,
	"status" "insight_status" DEFAULT 'pending' NOT NULL,
	"selected_metrics" jsonb,
	"all_metrics" jsonb,
	"anomalies" jsonb,
	"expense_anomalies" jsonb,
	"milestones" jsonb,
	"activity" jsonb,
	"currency" varchar(3) NOT NULL,
	"title" text,
	"content" jsonb,
	"predictions" jsonb,
	"audio_path" text,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insights_team_period_unique" UNIQUE("team_id","period_type","period_year","period_number")
);
--> statement-breakpoint
ALTER TABLE "insights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoice_recurring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_id" uuid,
	"frequency" "invoice_recurring_frequency" NOT NULL,
	"frequency_day" integer,
	"frequency_week" integer,
	"frequency_interval" integer,
	"end_type" "invoice_recurring_end_type" NOT NULL,
	"end_date" timestamp with time zone,
	"end_count" integer,
	"status" "invoice_recurring_status" DEFAULT 'active' NOT NULL,
	"invoices_generated" integer DEFAULT 0 NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"next_scheduled_at" timestamp with time zone,
	"last_generated_at" timestamp with time zone,
	"timezone" text NOT NULL,
	"due_date_offset" integer DEFAULT 30 NOT NULL,
	"amount" numeric(10, 2),
	"currency" text,
	"line_items" jsonb,
	"template" jsonb,
	"payment_details" jsonb,
	"from_details" jsonb,
	"note_details" jsonb,
	"customer_name" text,
	"vat" numeric(10, 2),
	"tax" numeric(10, 2),
	"discount" numeric(10, 2),
	"subtotal" numeric(10, 2),
	"top_block" jsonb,
	"bottom_block" jsonb,
	"template_id" uuid,
	"upcoming_notification_sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "invoice_recurring" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoice_templates" DROP CONSTRAINT "invoice_templates_team_id_key";--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "subscription_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due');--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "subscription_status" SET DATA TYPE "public"."subscription_status" USING "subscription_status"::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "subtype" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "bic" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "routing_number" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "wire_routing_number" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "sort_code" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "availableBalance" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "creditLimit" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "preferred_currency" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "default_payment_terms" integer;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "is_archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "source" text DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "company_type" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "employee_count" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "founded_year" integer;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "estimated_revenue" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "funding_stage" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "total_funding" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "headquarters_location" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "ceo_name" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "finance_contact" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "finance_contact_email" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "primary_language" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "fiscal_year_end" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "enrichment_status" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "enriched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "portal_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "portal_id" text;--> statement-breakpoint
ALTER TABLE "inbox" ADD COLUMN "sender_email" text;--> statement-breakpoint
ALTER TABLE "inbox" ADD COLUMN "invoice_number" text;--> statement-breakpoint
ALTER TABLE "inbox" ADD COLUMN "grouped_inbox_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice_products" ADD COLUMN "tax_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "name" text DEFAULT 'Default' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "is_default" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "include_line_item_tax" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "line_item_tax_label" text;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "payment_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "payment_terms_days" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_recurring_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_sequence" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "fiscal_year_start_month" smallint;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "subscription_status" "subscription_status";--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "stripe_connect_status" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "tax_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "accounting_sync_records" ADD CONSTRAINT "accounting_sync_records_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_sync_records" ADD CONSTRAINT "accounting_sync_records_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_blocklist" ADD CONSTRAINT "inbox_blocklist_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_user_status" ADD CONSTRAINT "insight_user_status_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_user_status" ADD CONSTRAINT "insight_user_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_transaction" ON "accounting_sync_records" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_team_provider" ON "accounting_sync_records" USING btree ("team_id","provider");--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_status" ON "accounting_sync_records" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "insight_user_status_user_idx" ON "insight_user_status" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "insight_user_status_insight_idx" ON "insight_user_status" USING btree ("insight_id");--> statement-breakpoint
CREATE INDEX "insights_team_id_idx" ON "insights" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "insights_team_period_type_idx" ON "insights" USING btree ("team_id","period_type","generated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "invoice_recurring_team_id_idx" ON "invoice_recurring" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "invoice_recurring_next_scheduled_at_idx" ON "invoice_recurring" USING btree ("next_scheduled_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "invoice_recurring_status_idx" ON "invoice_recurring" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_recurring_active_scheduled_idx" ON "invoice_recurring" USING btree ("next_scheduled_at" timestamptz_ops) WHERE status = 'active';--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_recurring_id_fkey" FOREIGN KEY ("invoice_recurring_id") REFERENCES "public"."invoice_recurring"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customers_status" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_customers_is_archived" ON "customers" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "idx_customers_enrichment_status" ON "customers" USING btree ("enrichment_status");--> statement-breakpoint
CREATE INDEX "idx_customers_website" ON "customers" USING btree ("website");--> statement-breakpoint
CREATE INDEX "idx_customers_industry" ON "customers" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "customers_team_id_idx" ON "customers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customers_team_created_at_idx" ON "customers" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_team_id_created_at_idx" ON "documents" USING btree ("team_id" uuid_ops,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "documents_team_id_date_idx" ON "documents" USING btree ("team_id" uuid_ops,"date");--> statement-breakpoint
CREATE INDEX "documents_team_id_name_idx" ON "documents" USING btree ("team_id" uuid_ops,"name" text_ops);--> statement-breakpoint
CREATE INDEX "inbox_invoice_number_idx" ON "inbox" USING btree ("invoice_number" text_ops);--> statement-breakpoint
CREATE INDEX "inbox_grouped_inbox_id_idx" ON "inbox" USING btree ("grouped_inbox_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_team_status_created_at_idx" ON "inbox" USING btree ("team_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_invoice_templates_team_id" ON "invoice_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoices_template_id_idx" ON "invoices" USING btree ("template_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "invoices_team_sent_at_idx" ON "invoices" USING btree ("team_id","sent_at");--> statement-breakpoint
CREATE INDEX "invoices_team_status_paid_at_idx" ON "invoices" USING btree ("team_id","status","paid_at");--> statement-breakpoint
CREATE INDEX "invoices_invoice_recurring_id_idx" ON "invoices" USING btree ("invoice_recurring_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_recurring_sequence_unique_idx" ON "invoices" USING btree ("invoice_recurring_id","recurring_sequence") WHERE invoice_recurring_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "tracker_entries_team_date_idx" ON "tracker_entries" USING btree ("team_id","date");--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "taxRate";--> statement-breakpoint
CREATE POLICY "Team members can view their sync records" ON "accounting_sync_records" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Team members can insert sync records" ON "accounting_sync_records" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Team members can update sync records" ON "accounting_sync_records" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Inbox blocklist can be deleted by a member of the team" ON "inbox_blocklist" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Inbox blocklist can be inserted by a member of the team" ON "inbox_blocklist" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Inbox blocklist can be selected by a member of the team" ON "inbox_blocklist" AS PERMISSIVE FOR SELECT TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Users can manage their own insight status" ON "insight_user_status" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Team members can view their insights" ON "insights" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Invoice recurring can be handled by a member of the team" ON "invoice_recurring" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));