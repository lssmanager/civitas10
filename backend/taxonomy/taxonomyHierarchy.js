"use strict";
const { TAXONOMY_REASON_CODES } = require("./taxonomyReasonCodes");
const { taxonomyError } = require("./taxonomyValidation");
function assertParentAllowed({ definition, child, parent, ancestorLoader }) {
  if (!parent) return true;
  if (!definition?.hierarchyAllowed) throw taxonomyError(TAXONOMY_REASON_CODES.HIERARCHY_NOT_ALLOWED);
  if (String(child.id) === String(parent.id)) throw taxonomyError(TAXONOMY_REASON_CODES.PARENT_INVALID);
  if (child.logtoOrganizationId !== parent.logtoOrganizationId) throw taxonomyError(TAXONOMY_REASON_CODES.PARENT_CROSS_TENANT);
  if (child.dimensionDefinitionId !== parent.dimensionDefinitionId) throw taxonomyError(TAXONOMY_REASON_CODES.PARENT_WRONG_DIMENSION);
  if (parent.status === "archived") throw taxonomyError(TAXONOMY_REASON_CODES.PARENT_INVALID);
  const ancestors = ancestorLoader ? ancestorLoader(parent.id) : [];
  if (ancestors.some((ancestor) => String(ancestor.id) === String(child.id))) throw taxonomyError(TAXONOMY_REASON_CODES.CYCLE_DETECTED);
  return true;
}
const ANTI_CYCLE_SQL = `WITH RECURSIVE ancestors AS (\n  SELECT id, parent_value_id, ARRAY[id] AS path\n  FROM organization_dimension_values\n  WHERE id = $candidate_parent_id\n    AND logto_organization_id = $organization_id\n    AND dimension_definition_id = $definition_id\n  UNION ALL\n  SELECT p.id, p.parent_value_id, a.path || p.id\n  FROM organization_dimension_values p\n  JOIN ancestors a ON p.id = a.parent_value_id\n  WHERE p.logto_organization_id = $organization_id\n    AND p.dimension_definition_id = $definition_id\n    AND NOT p.id = ANY(a.path)\n)\nSELECT 1 FROM ancestors WHERE id = $child_id LIMIT 1;`;
const ADVISORY_LOCK_SQL = "SELECT pg_advisory_xact_lock(hashtextextended($organization_id || ':' || $dimension_key, 0));";
module.exports = { assertParentAllowed, ANTI_CYCLE_SQL, ADVISORY_LOCK_SQL };
