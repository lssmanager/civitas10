"use strict";
const {RELATIONSHIP_KEYS}=require("./dataScopeRegistry"); const {DATA_SCOPE_REASON_CODES,dataScopeError}=require("./dataScopeReasonCodes");
function validateRelationshipKey(key){ if(!RELATIONSHIP_KEYS.includes(key)) throw dataScopeError(DATA_SCOPE_REASON_CODES.RELATIONSHIP_UNKNOWN); return key; }
function isCandidateActive(c,now=new Date()){return c&&new Date(c.validFrom)<=now&&(!c.validUntil||new Date(c.validUntil)>now);}
module.exports={validateRelationshipKey,isCandidateActive};
