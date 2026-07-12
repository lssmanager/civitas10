"use strict";
function redactDataScopeAudit(event={}){ const {token,claims,sql,students,connectorSecret,...safe}=event; return safe; }
module.exports={redactDataScopeAudit};
