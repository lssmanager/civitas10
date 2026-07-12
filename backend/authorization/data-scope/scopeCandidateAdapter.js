"use strict";
const {isCandidateActive}=require("./relationshipScopeAdapter"); const {DATA_SCOPE_REASON_CODES,dataScopeError}=require("./dataScopeReasonCodes");
function normalizeScopeCandidate(c,{organizationId,logtoRoleId}={}){ if(!c||c.organizationId!==organizationId) throw dataScopeError(DATA_SCOPE_REASON_CODES.CANDIDATE_STALE); if(logtoRoleId&&c.logtoRoleId!==logtoRoleId) throw dataScopeError(DATA_SCOPE_REASON_CODES.ROLE_MISMATCH); if(!isCandidateActive(c)) throw dataScopeError(DATA_SCOPE_REASON_CODES.CANDIDATE_STALE); return {...c}; }
async function candidatesForRolePath({scopeCandidateProvider,organizationId,subjectId,logtoRoleId,capability}={}){ if(!scopeCandidateProvider?.listCandidates) return []; const all=await scopeCandidateProvider.listCandidates({organizationId,subjectId,logtoRoleId,capability}); return all.map(c=>normalizeScopeCandidate(c,{organizationId,logtoRoleId})); }
module.exports={normalizeScopeCandidate,candidatesForRolePath};
