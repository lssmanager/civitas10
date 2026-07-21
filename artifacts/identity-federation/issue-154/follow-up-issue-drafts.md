# Issue #154 Phase 0 follow-up drafts

## Remote read-only Logto evidence capture (#154)
Capture version, edition, Management API endpoint shapes, SSO/JIT object fields, Custom Token Script context, and group completeness with the read-only probe and explicit remote-read flag.

## Role model migration blocker (#162/#165)
Retire legacy assumptions around Admin-org and Student-org only after canonical role potential and active-only Logto materialization are generated and accepted.

## SCIM authority split (#155)
Define SCIM desired-state provenance and correlation with login-time federated identity evidence without treating SCIM groups as roles, units, cohorts, or Data Scope.

## Seat activation guard (#156)
Define the future seat validation operation required before membership activation or role materialization; JIT must not create billable access automatically.

## Identity reconciliation operations (#180)
Design operation resources/outbox-inbox/DLQ for long-running directory fetch, reconciliation, role materialization, mass deprovision, and credential rotation.
