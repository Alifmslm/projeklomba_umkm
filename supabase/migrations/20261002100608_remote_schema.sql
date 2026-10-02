SET local check_function_bodies = off;

CREATE TABLE "public"."booking_events" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "booking_id" bigint                   NOT NULL,
  "actor_id"   uuid,
  "note"       text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "booking_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."booking_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bookings" (
  "id"              bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "code"            text                     NOT NULL,
  "umkm_id"         bigint                   NOT NULL,
  "influencer_id"   bigint                   NOT NULL,
  "package_id"      bigint                   NOT NULL,
  "package_name"    text                     NOT NULL,
  "amount"          integer                  NOT NULL,
  "revision_quota"  integer                  NOT NULL,
  "estimated_days"  integer                  NOT NULL,
  "revisions_used"  integer                  NOT NULL DEFAULT 0,
  "brief"           text                     NOT NULL,
  "review_extended" boolean                  NOT NULL DEFAULT false,
  "brief_locked_at" timestamp with time zone,
  "accepted_at"     timestamp with time zone,
  "payment_due_at"  timestamp with time zone,
  "funded_at"       timestamp with time zone,
  "deadline_at"     timestamp with time zone,
  "submitted_at"    timestamp with time zone,
  "review_due_at"   timestamp with time zone,
  "completed_at"    timestamp with time zone,
  "cancelled_at"    timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "bookings_code_key" UNIQUE (code),
  CONSTRAINT "bookings_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."bookings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."categories" (
  "id"   bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "name" text   NOT NULL,
  "slug" text   NOT NULL,
  CONSTRAINT "categories_name_key" UNIQUE (name),
  CONSTRAINT "categories_pkey" PRIMARY KEY (id),
  CONSTRAINT "categories_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."conversations" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "booking_id" bigint                   NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "conversations_booking_id_key" UNIQUE (booking_id),
  CONSTRAINT "conversations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."conversations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."deliveries" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "booking_id"   bigint                   NOT NULL,
  "round"        integer                  NOT NULL,
  "content_url"  text                     NOT NULL,
  "note"         text,
  "submitted_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "deliveries_booking_id_round_key" UNIQUE (booking_id, round),
  CONSTRAINT "deliveries_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."deliveries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."dispute_infos" (
  "id"          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "dispute_id"  bigint                   NOT NULL,
  "asked_by"    uuid                     NOT NULL,
  "question"    text                     NOT NULL,
  "answer"      text,
  "answered_by" uuid,
  "answered_at" timestamp with time zone,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "dispute_infos_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."dispute_infos"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."disputes" (
  "id"                    bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "code"                  text                     NOT NULL,
  "booking_id"            bigint                   NOT NULL,
  "reason"                text                     NOT NULL,
  "due_at"                timestamp with time zone NOT NULL,
  "paused_at"             timestamp with time zone,
  "creator_share_percent" integer,
  "decision_note"         text,
  "decided_by"            uuid,
  "decided_at"            timestamp with time zone,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "disputes_booking_id_key" UNIQUE (booking_id),
  CONSTRAINT "disputes_code_key" UNIQUE (code),
  CONSTRAINT "disputes_creator_share_percent_check" CHECK (((creator_share_percent >= 0) AND (creator_share_percent <= 100))),
  CONSTRAINT "disputes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."disputes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."influencers" (
  "id"             bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "name"           text                     NOT NULL,
  "handle"         text                     NOT NULL,
  "category_id"    bigint                   NOT NULL,
  "city"           text                     NOT NULL,
  "followers"      integer                  NOT NULL DEFAULT 0,
  "bio"            text,
  "verified"       boolean                  NOT NULL DEFAULT false,
  "rating"         numeric(2,1)             NOT NULL DEFAULT 0,
  "review_count"   integer                  NOT NULL DEFAULT 0,
  "starting_price" integer,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "influencers_handle_key" UNIQUE (handle),
  CONSTRAINT "influencers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."influencers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."messages" (
  "id"              bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "conversation_id" bigint                   NOT NULL,
  "sender_id"       uuid                     NOT NULL,
  "body"            text                     NOT NULL,
  "sent_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "read_at"         timestamp with time zone,
  CONSTRAINT "messages_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notifications" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "booking_id" bigint,
  "type"       text                     NOT NULL,
  "message"    text                     NOT NULL,
  "link"       text,
  "read_at"    timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."packages" (
  "id"             bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "influencer_id"  bigint                   NOT NULL,
  "name"           text                     NOT NULL,
  "price"          integer                  NOT NULL,
  "summary"        text,
  "includes"       jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "revision_quota" integer                  NOT NULL,
  "estimated_days" integer                  NOT NULL,
  "is_active"      boolean                  NOT NULL DEFAULT true,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "packages_pkey" PRIMARY KEY (id),
  CONSTRAINT "packages_revision_quota_check" CHECK (((revision_quota >= 1) AND (revision_quota <= 5)))
);

ALTER TABLE "public"."packages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."payments" (
  "id"                 bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "booking_id"         bigint                   NOT NULL,
  "total_amount"       integer                  NOT NULL,
  "creator_amount"     integer                  NOT NULL DEFAULT 0,
  "umkm_refund_amount" integer                  NOT NULL DEFAULT 0,
  "gateway_ref"        text,
  "held_at"            timestamp with time zone,
  "settled_at"         timestamp with time zone,
  CONSTRAINT "payments_booking_id_key" UNIQUE (booking_id),
  CONSTRAINT "payments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."payments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "user_id"       uuid                     NOT NULL,
  "full_name"     text,
  "umkm_id"       bigint,
  "influencer_id" bigint,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_influencer_id_key" UNIQUE (influencer_id),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "profiles_umkm_id_key" UNIQUE (umkm_id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."resolution_offers" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "booking_id"   bigint                   NOT NULL,
  "value"        integer                  NOT NULL,
  "fee"          integer                  NOT NULL DEFAULT 0,
  "note"         text,
  "expires_at"   timestamp with time zone NOT NULL,
  "responded_at" timestamp with time zone,
  "escalated_at" timestamp with time zone,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "resolution_offers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."resolution_offers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reviews" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "booking_id" bigint                   NOT NULL,
  "rating"     integer                  NOT NULL,
  "comment"    text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))
);

ALTER TABLE "public"."reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."revision_requests" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "booking_id"   bigint                   NOT NULL,
  "delivery_id"  bigint                   NOT NULL,
  "round"        integer                  NOT NULL,
  "section"      text                     NOT NULL,
  "note"         text                     NOT NULL,
  "within_brief" boolean                  NOT NULL DEFAULT true,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "revision_requests_delivery_id_key" UNIQUE (delivery_id),
  CONSTRAINT "revision_requests_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."revision_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."umkms" (
  "id"          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "name"        text                     NOT NULL,
  "owner"       text                     NOT NULL,
  "category_id" bigint                   NOT NULL,
  "city"        text                     NOT NULL,
  "budget"      integer,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "umkms_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."umkms"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."actor_role" AS ENUM (
  'umkm',
  'influencer',
  'admin',
  'system'
);

ALTER TABLE "public"."booking_events"
  ADD COLUMN "actor_role" public.actor_role NOT NULL;

CREATE TYPE "public"."booking_status" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'FUNDED',
  'SUBMITTED',
  'REVISION',
  'DISPUTED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
);

ALTER TABLE "public"."booking_events"
  ADD COLUMN "from_status" public.booking_status;

ALTER TABLE "public"."booking_events"
  ADD COLUMN "to_status" public.booking_status NOT NULL;

ALTER TABLE "public"."bookings"
  ADD COLUMN "status" public.booking_status NOT NULL DEFAULT 'PENDING'::public.booking_status;

CREATE TYPE "public"."dispute_decision" AS ENUM (
  'RELEASE_FULL',
  'REFUND_FULL',
  'SPLIT'
);

ALTER TABLE "public"."disputes"
  ADD COLUMN "decision" public.dispute_decision;

CREATE TYPE "public"."dispute_status" AS ENUM (
  'OPEN',
  'NEED_INFO',
  'RESOLVED'
);

ALTER TABLE "public"."disputes"
  ADD COLUMN "status" public.dispute_status NOT NULL DEFAULT 'OPEN'::public.dispute_status;

CREATE TYPE "public"."offer_status" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED'
);

ALTER TABLE "public"."resolution_offers"
  ADD COLUMN "status" public.offer_status NOT NULL DEFAULT 'PENDING'::public.offer_status;

CREATE TYPE "public"."offer_type" AS ENUM (
  'EXTRA_REVISION',
  'DISCOUNT',
  'CANCELLATION'
);

ALTER TABLE "public"."resolution_offers"
  ADD COLUMN "type" public.offer_type NOT NULL;

CREATE TYPE "public"."party_role" AS ENUM (
  'umkm',
  'influencer'
);

ALTER TABLE "public"."dispute_infos"
  ADD COLUMN "target_role" public.party_role NOT NULL;

ALTER TABLE "public"."disputes"
  ADD COLUMN "opened_by" public.party_role NOT NULL;

ALTER TABLE "public"."resolution_offers"
  ADD COLUMN "offered_by" public.party_role NOT NULL;

ALTER TABLE "public"."reviews"
  ADD COLUMN "reviewer_role" public.party_role NOT NULL;

CREATE TYPE "public"."payment_status" AS ENUM (
  'UNPAID',
  'HELD',
  'RELEASED',
  'REFUNDED',
  'SPLIT'
);

ALTER TABLE "public"."payments"
  ADD COLUMN "status" public.payment_status NOT NULL DEFAULT 'UNPAID'::public.payment_status;

CREATE TYPE "public"."user_role" AS ENUM (
  'umkm',
  'influencer',
  'admin'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "role" public.user_role NOT NULL;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

ALTER TABLE "public"."booking_events"
  ADD CONSTRAINT "booking_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."booking_events"
  ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."conversations"
  ADD CONSTRAINT "conversations_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."deliveries"
  ADD CONSTRAINT "deliveries_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."dispute_infos"
  ADD CONSTRAINT "dispute_infos_answered_by_fkey" FOREIGN KEY (answered_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."dispute_infos"
  ADD CONSTRAINT "dispute_infos_asked_by_fkey" FOREIGN KEY (asked_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE "public"."disputes"
  ADD CONSTRAINT "disputes_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE RESTRICT;

ALTER TABLE "public"."disputes"
  ADD CONSTRAINT "disputes_decided_by_fkey" FOREIGN KEY (decided_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."dispute_infos"
  ADD CONSTRAINT "dispute_infos_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;

ALTER TABLE "public"."influencers"
  ADD CONSTRAINT "influencers_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_influencer_id_fkey" FOREIGN KEY (influencer_id) REFERENCES public.influencers(id) ON DELETE RESTRICT;

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."packages"
  ADD CONSTRAINT "packages_influencer_id_fkey" FOREIGN KEY (influencer_id) REFERENCES public.influencers(id) ON DELETE RESTRICT;

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_package_id_fkey" FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE RESTRICT;

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_influencer_id_fkey" FOREIGN KEY (influencer_id) REFERENCES public.influencers(id) ON DELETE RESTRICT;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_role_link_chk" CHECK ((((role = 'umkm'::public.user_role) AND (umkm_id IS
    NOT NULL) AND (influencer_id IS NULL)) OR ((role = 'influencer'::public.user_role) AND (influencer_id IS
    NOT NULL) AND (umkm_id IS NULL)) OR ((role = 'admin'::public.user_role) AND (umkm_id IS NULL) AND (influencer_id IS NULL))));

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."resolution_offers"
  ADD CONSTRAINT "resolution_offers_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_booking_id_reviewer_role_key" UNIQUE (booking_id, reviewer_role);

ALTER TABLE "public"."revision_requests"
  ADD CONSTRAINT "revision_requests_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."revision_requests"
  ADD CONSTRAINT "revision_requests_delivery_id_fkey" FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;

ALTER TABLE "public"."umkms"
  ADD CONSTRAINT "umkms_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_umkm_id_fkey" FOREIGN KEY (umkm_id) REFERENCES public.umkms(id) ON DELETE RESTRICT;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_umkm_id_fkey" FOREIGN KEY (umkm_id) REFERENCES public.umkms(id) ON DELETE RESTRICT;

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "service_role";

REVOKE ALL ON SEQUENCE "public"."booking_events_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."booking_events_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."booking_events_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."booking_events_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."booking_events_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."booking_events_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."booking_events_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."booking_events_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."bookings_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."bookings_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."bookings_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."bookings_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."bookings_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."bookings_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."bookings_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."bookings_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."categories_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."categories_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."categories_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."categories_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."categories_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."categories_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."categories_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."categories_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."conversations_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."conversations_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."conversations_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."conversations_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."conversations_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."conversations_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."conversations_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."conversations_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."deliveries_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."deliveries_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."deliveries_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."deliveries_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."deliveries_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."deliveries_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."deliveries_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."deliveries_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."dispute_infos_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."dispute_infos_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."dispute_infos_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."dispute_infos_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."dispute_infos_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."dispute_infos_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."dispute_infos_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."dispute_infos_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."disputes_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."disputes_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."disputes_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."disputes_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."disputes_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."disputes_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."disputes_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."disputes_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."influencers_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."influencers_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."influencers_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."influencers_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."influencers_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."influencers_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."influencers_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."influencers_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."messages_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."messages_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."messages_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."messages_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."messages_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."messages_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."messages_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."messages_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."notifications_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."notifications_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."notifications_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."notifications_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."notifications_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."notifications_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."notifications_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."packages_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."packages_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."packages_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."packages_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."packages_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."packages_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."packages_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."packages_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."payments_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."payments_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."payments_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."payments_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."payments_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."payments_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."payments_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."payments_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."resolution_offers_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."resolution_offers_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."resolution_offers_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."resolution_offers_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."resolution_offers_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."resolution_offers_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."resolution_offers_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."resolution_offers_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."reviews_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."reviews_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."reviews_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."reviews_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."reviews_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."reviews_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."reviews_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."revision_requests_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."revision_requests_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."revision_requests_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."revision_requests_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."revision_requests_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."revision_requests_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."revision_requests_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."revision_requests_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."umkms_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."umkms_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."umkms_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."umkms_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."umkms_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."umkms_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."umkms_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."umkms_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."booking_events" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."booking_events" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."booking_events" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."booking_events" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bookings" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."bookings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bookings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bookings" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."categories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."conversations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversations" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."deliveries" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."deliveries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."deliveries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."deliveries" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dispute_infos" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."dispute_infos" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dispute_infos" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dispute_infos" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."disputes" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."disputes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."disputes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."disputes" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."influencers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."influencers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."influencers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."influencers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."packages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."packages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."packages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."packages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."payments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."resolution_offers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."resolution_offers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."resolution_offers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."resolution_offers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."reviews" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."revision_requests" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."revision_requests" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."revision_requests" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."revision_requests" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."umkms" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."umkms" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."umkms" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."umkms" TO "service_role";

