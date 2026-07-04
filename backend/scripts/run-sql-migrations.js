#!/usr/bin/env node
"use strict";

require("dotenv").config();

const { closeDatabase } = require("../lib/db");
const { runSqlMigrations, assertOperationalSchema } = require("../runtime/migrations");

runSqlMigrations()
  .then((result) => assertOperationalSchema().then((schema) => ({ result, schema })))
  .then(({ result, schema }) => {
    console.log(JSON.stringify({ component: "database-migrations", status: "ok", applied: result.applied, checkedTables: schema.checkedTables }));
  })
  .catch((error) => {
    console.error(JSON.stringify({ component: "database-migrations", status: "failed", error: error.message, code: error.code || null, details: error.details || null }));
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
