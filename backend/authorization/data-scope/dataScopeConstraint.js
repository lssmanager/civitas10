"use strict";
const {DATA_SCOPE_REASON_CODES,dataScopeError}=require("./dataScopeReasonCodes");
const LIMITS=Object.freeze({maxRolePaths:12,maxDimensionValues:100,maxRelationshipTargets:250,maxExplicitResourceRefs:250,maxAstDepth:4,maxBulkResourceIds:500});
function deny(reasonCode){return{kind:"deny",reasonCode};}
function organization(organizationId){return{kind:"organization",organizationId};}
function dimensions(clauses){return{kind:"dimensions",clauses};}
function relationships(clauses){return{kind:"relationships",clauses};}
function self(subjectId){return{kind:"self",subjectId};}
function or(paths){return{kind:"or",paths};}
function assertConstraintSafe(c,depth=0){ if(depth>LIMITS.maxAstDepth) throw dataScopeError(DATA_SCOPE_REASON_CODES.CONSTRAINT_TOO_COMPLEX); if(!c||typeof c!=="object") throw dataScopeError(DATA_SCOPE_REASON_CODES.CONSTRAINT_TOO_COMPLEX); if(c.kind==="dimensions"&&c.clauses?.some(x=>!Array.isArray(x.valueIds)||x.valueIds.length>LIMITS.maxDimensionValues||x.operator!=="in")) throw dataScopeError(DATA_SCOPE_REASON_CODES.CONSTRAINT_TOO_COMPLEX); if(c.kind==="relationships"&&c.clauses?.some(x=>!Array.isArray(x.targetRefs)||x.targetRefs.length>LIMITS.maxRelationshipTargets)) throw dataScopeError(DATA_SCOPE_REASON_CODES.CONSTRAINT_TOO_COMPLEX); if(c.kind==="or") c.paths.forEach(p=>assertConstraintSafe(p,depth+1)); return c; }
module.exports={LIMITS,deny,organization,dimensions,relationships,self,or,assertConstraintSafe};
