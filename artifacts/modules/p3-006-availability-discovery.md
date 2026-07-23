# P3-006 availability discovery

P3-006 consumes P3-005 module control-plane primitives and capability primitives. It adds sanitized health snapshots and circuit state as operational primitives and integrates a safe availability summary into PBAC decisions.

No remote probe runs in the PBAC hot path. No endpoint, `secretsRef`, credential, header, token, or raw provider response is exposed in the public read model.
