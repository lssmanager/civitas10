-- ADR: frozen Owner-published management level catalog for organization_units.
-- management_level is presentation metadata and structural validation only; it is not an authorization input.

ALTER TABLE organization_units
  ADD COLUMN IF NOT EXISTS management_level varchar(32) NOT NULL DEFAULT 'operational';

UPDATE organization_units
   SET management_level = CASE WHEN parent_unit_id IS NULL THEN 'organization' ELSE management_level END
 WHERE management_level IS NULL OR (parent_unit_id IS NULL AND management_level <> 'organization');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_units_management_level_check') THEN
    ALTER TABLE organization_units
      ADD CONSTRAINT organization_units_management_level_check
      CHECK (management_level IN ('organization','strategic','tactical','coordination','operational','administrative'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS organization_units_one_root_management_level_uidx
  ON organization_units(logto_organization_id)
  WHERE management_level = 'organization' AND status <> 'archived';

CREATE OR REPLACE FUNCTION organization_units_management_level_order(level varchar) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE level
    WHEN 'organization' THEN 0
    WHEN 'strategic' THEN 1
    WHEN 'tactical' THEN 2
    WHEN 'coordination' THEN 3
    WHEN 'operational' THEN 4
    WHEN 'administrative' THEN 5
  END
$$;

CREATE OR REPLACE FUNCTION organization_units_guard_parent() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE found_cycle boolean; parent_level varchar;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(new.logto_organization_id || ':' || new.hierarchy_key, 0));
  IF new.parent_unit_id IS NULL THEN
    IF new.management_level <> 'organization' THEN RAISE EXCEPTION 'management_level_root_required'; END IF;
    RETURN new;
  END IF;
  IF new.management_level = 'organization' THEN RAISE EXCEPTION 'management_level_root_reserved'; END IF;
  SELECT p.management_level INTO parent_level FROM organization_units p WHERE p.id = new.parent_unit_id AND p.logto_organization_id = new.logto_organization_id AND p.hierarchy_key = new.hierarchy_key AND p.status <> 'archived';
  IF parent_level IS NULL THEN RAISE EXCEPTION 'organization_unit_parent_invalid'; END IF;
  IF parent_level <> 'organization' AND organization_units_management_level_order(new.management_level) <= organization_units_management_level_order(parent_level) THEN RAISE EXCEPTION 'management_level_order_invalid'; END IF;
  WITH RECURSIVE ancestors AS (
    SELECT id, parent_unit_id, ARRAY[id] AS path FROM organization_units WHERE id = new.parent_unit_id AND logto_organization_id = new.logto_organization_id AND hierarchy_key = new.hierarchy_key
    UNION ALL
    SELECT p.id, p.parent_unit_id, a.path || p.id FROM organization_units p JOIN ancestors a ON p.id = a.parent_unit_id WHERE p.logto_organization_id = new.logto_organization_id AND p.hierarchy_key = new.hierarchy_key AND NOT p.id = ANY(a.path)
  ) SELECT EXISTS(SELECT 1 FROM ancestors WHERE id = new.id LIMIT 1) INTO found_cycle;
  IF found_cycle THEN RAISE EXCEPTION 'organization_unit_cycle_detected'; END IF;
  RETURN new;
END $$;
DROP TRIGGER IF EXISTS organization_units_parent_guard_trigger ON organization_units;
CREATE CONSTRAINT TRIGGER organization_units_parent_guard_trigger AFTER INSERT OR UPDATE OF parent_unit_id, logto_organization_id, hierarchy_key, management_level ON organization_units DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION organization_units_guard_parent();
