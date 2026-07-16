-- Phase 2 #101 authorization runtime consistency.
-- Rollback: drop authorization_outbox_events after all publishers are drained;
-- keep visual_version on authorization_policy_versions for compatibility.

ALTER TABLE authorization_policy_versions
  ADD COLUMN IF NOT EXISTS visual_version bigint NOT NULL DEFAULT 1;

UPDATE authorization_policy_versions
   SET catalog_version = COALESCE(catalog_version, '1'),
       reason = COALESCE(reason, 'runtime_consistency_backfill')
 WHERE catalog_version IS NULL OR reason IS NULL;

ALTER TABLE authorization_policy_versions
  ALTER COLUMN catalog_version SET DEFAULT '1',
  ALTER COLUMN catalog_version SET NOT NULL,
  ALTER COLUMN reason SET DEFAULT 'provisioned',
  ALTER COLUMN reason SET NOT NULL;

CREATE TABLE IF NOT EXISTS authorization_outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(140) NOT NULL,
  aggregate_type varchar(100) NOT NULL,
  aggregate_id varchar(180) NOT NULL,
  event_version varchar(80) NOT NULL,
  logto_organization_id varchar(128),
  subject_logto_user_id varchar(128),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(32) NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  claimed_by varchar(160),
  claimed_at timestamptz,
  published_at timestamptz,
  last_error_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT authorization_outbox_events_status_ck CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  CONSTRAINT authorization_outbox_events_attempts_ck CHECK (attempts >= 0),
  CONSTRAINT authorization_outbox_events_payload_redacted_ck CHECK (
    NOT (payload ? 'accessToken')
    AND NOT (payload ? 'refreshToken')
    AND NOT (payload ? 'bearerToken')
    AND NOT (payload ? 'clientSecret')
    AND NOT (payload ? 'connectorSecret')
  ),
  CONSTRAINT authorization_outbox_event_aggregate_version_uidx UNIQUE (event_type, aggregate_type, aggregate_id, event_version)
);

CREATE INDEX IF NOT EXISTS authorization_outbox_status_available_idx
  ON authorization_outbox_events (status, available_at);
CREATE INDEX IF NOT EXISTS authorization_outbox_org_created_idx
  ON authorization_outbox_events (logto_organization_id, created_at);
CREATE INDEX IF NOT EXISTS authorization_outbox_subject_created_idx
  ON authorization_outbox_events (subject_logto_user_id, created_at);
CREATE INDEX IF NOT EXISTS authorization_outbox_claim_lease_idx
  ON authorization_outbox_events (claimed_at)
  WHERE status = 'publishing';

-- #95 closed contract is intentionally restated for migration-contract checks.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'authorization_scope_assignments_exactly_one_target_ck'
  ) THEN
    ALTER TABLE authorization_scope_assignments
    ADD CONSTRAINT authorization_scope_assignments_exactly_one_target_ck
    CHECK (
      num_nonnulls(dimension_value_id, unit_id, resource_ref) = 1
    );
  END IF;
END $$;
