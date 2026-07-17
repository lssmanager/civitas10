# Civitas — Senior Module Developer Guide

## Estado y autoridad

**Estado:** guía normativa de evolución para la implementación del runtime modular de Civitas.  
**Ámbito:** backend, contratos, autorización, persistencia, eventos, MCP, frontend, CI y revisión de arquitectura.  
**Audiencia:** staff/senior engineers, arquitectos, maintainers y agentes de desarrollo que implementen capacidades en Civitas.

Este documento no reemplaza los contratos normativos existentes. Los complementa y define la ruta de implementación para evolucionar el repositorio actual hacia la arquitectura modular aprobada.

Fuentes de verdad relacionadas:

- `docs/architecture/CIVITAS_AUTHORIZATION_POLICY_MODEL.md`: RBAC, PBAC, ABAC, tenant isolation y autorización efectiva.
- `frontend/docs/VISUAL_ACCESS_CONTRACT.md`: screen/action registry, navegación y visual authorization.
- `docs/architecture/module-architecture.md`: módulos, capabilities, adapters y límites del core.
- `docs/architecture/api-contracts.md`: REST, eventos y MCP como delivery surfaces sobre application services.
- `docs/architecture/module-event-contracts.md`: eventos versionados, outbox, idempotencia y consumo.
- `docs/architecture/module-data-model.md`: catálogo modular, instalaciones tenant y bindings.
- `docs/adr/ADR-001-mcp-boundary.md`: MCP no es dominio ni runtime de negocio.

Cuando exista conflicto, las decisiones normativas de autorización y los ADR aprobados prevalecen. Este guide no autoriza shortcuts.

---

## 1. Objetivo de la guía

La meta no es simplemente crear carpetas bajo `backend/modules`. La meta es introducir capacidades de negocio sin romper:

- aislamiento tenant;
- catálogo canónico de permisos;
- Owner Ceilings, Tenant Activations y data scopes;
- contratos de navegación y visual authorization;
- consistencia entre REST, jobs, eventos y MCP;
- trazabilidad operativa y auditoría;
- reemplazabilidad de proveedores;
- validación contractual en CI.

Una implementación modular correcta debe producir un **vertical slice** completo y verificable:

```text
module declaration
  -> capability contract
  -> canonical permissions
  -> application service
  -> authorization policy
  -> provider-neutral port
  -> adapter implementation
  -> persistence and/or external provider
  -> transactional event
  -> REST and optional MCP delivery
  -> screen/action/navigation contribution
  -> tests and validators
```

No se considera implementado un módulo porque exista un endpoint, una pantalla o un connector. Debe existir coherencia de extremo a extremo.

---

## 2. Principios no negociables

### 2.1 El módulo es frontera de producto, no carpeta técnica

Un módulo agrupa responsabilidades de negocio coherentes. Civitas mantiene inicialmente diez módulos:

- `lms`
- `crm`
- `marketing`
- `community`
- `payments`
- `hr`
- `scheduling`
- `support`
- `analytics`
- `reports`

Identity, authorization, audit, queues, event delivery, secrets, files, communication transport, video transport y observability son capacidades de plataforma compartidas. No deben aparecer silenciosamente como módulos 11, 12 o 13.

### 2.2 Capability primero, proveedor después

El dominio solicita `lms.enrollment`, no `moodle`. Solicita `marketing.campaign`, no `mautic`. Solicita `analytics.pageview`, no `matomo`.

Los nombres de proveedor pueden existir en:

- adapter type;
- configuración operacional;
- technical mapping;
- diagnóstico;
- métricas del adapter;
- documentación específica del adapter.

No deben aparecer como identidad canónica de permiso, route, screen, action, aggregate o evento de dominio.

### 2.3 Application services son la única entrada al negocio

REST, eventos, workers y MCP deben converger en el mismo application service. Está prohibido:

- que un MCP tool llame por loopback al REST público;
- que un REST controller invoque un MCP tool;
- que un webhook escriba directamente en tablas de dominio;
- que una pantalla decida autorización;
- que un adapter contenga reglas de rol o navegación.

### 2.4 Activación de módulo y autorización son condiciones independientes

```text
module active
AND capability available
AND provider binding valid, when required
AND canonical permission effective
AND policies pass
AND data scope permits resource
= operation may execute
```

Un permiso no activa un módulo. Activar un módulo no concede permiso.

### 2.5 Evolución incremental y compatible

El repositorio actual tiene contratos históricos como `billing`, `communications`, `notifications`, `connectors`, `email`, `storage` y `automation`. No deben eliminarse ni renombrarse de forma masiva para “hacer coincidir” inmediatamente la arquitectura objetivo.

La evolución correcta es:

1. declarar el ownership objetivo;
2. mantener compatibilidad donde haya consumidores activos;
3. introducir alias o mappings explícitos;
4. migrar consumidores;
5. deprecar con replacement;
6. eliminar solo después de contract tests, migración y evidencia de cero consumidores.

---

## 3. Ruta dorada para implementar un vertical slice

Toda capacidad nueva debe seguir este orden. Saltarse una etapa requiere ADR y justificación explícita.

### Paso 1 — Definir el problema y el owner del dominio

Antes de escribir código, documentar:

- módulo owner;
- capability ID;
- operación o use case;
- actor principal;
- recurso y aggregate involucrado;
- si requiere proveedor externo;
- si es síncrono, asíncrono o ambos;
- datos sensibles;
- permisos requeridos;
- estrategia ABAC;
- eventos producidos/consumidos;
- superficie REST;
- superficie MCP, si existe;
- screen/action/navigation, si existe.

Una capability debe tener un único módulo owner. Otros módulos pueden consumirla mediante application interface o evento, no mediante imports de adapter.

### Paso 2 — Registrar o extender el módulo

La implementación objetivo deberá contar con un manifest canónico validado. Mientras el schema ejecutable no exista, las contribuciones deben mantenerse reconocibles y centralizadas.

Forma conceptual:

```ts
type CivitasModuleManifest = {
  id: CivitasModuleId;
  version: string;
  capabilities: CapabilityDeclaration[];
  permissions: CanonicalPermissionReference[];
  api: ApiContribution[];
  events: EventContribution[];
  adapters: AdapterDeclaration[];
  ui: UiContribution[];
  dependencies: ModuleDependency[];
};
```

El manifest debe ser declarativo. No puede contener:

- secrets;
- access tokens;
- lógica ejecutable de proveedor;
- live provider state;
- reglas de autorización arbitrarias;
- callbacks serializados;
- rutas sin IDs estables.

### Paso 3 — Registrar la capability

Una capability es un contrato estable y provider-neutral.

Convención recomendada:

```text
<module>.<resource-or-subdomain>
```

Ejemplos:

```text
lms.grades
lms.enrollment
crm.contacts
marketing.campaigns
scheduling.booking
support.tickets
analytics.acquisition
reports.gradebook
```

No usar verbos en la capability. Los verbos pertenecen a operations/actions/permissions.

Contrato conceptual:

```ts
interface CapabilityDefinition {
  id: string;
  moduleId: CivitasModuleId;
  contractVersion: string;
  operations: readonly string[];
  requiresAdapter: boolean;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  dependencies: readonly string[];
}
```

#### Integración con el código actual

El repositorio ya contiene `registry_capabilities`, `registry_adapters`, `registry_connectors` y `registry_connector_bindings`. Estas tablas representan una base capability-first, pero todavía no distinguen completamente module catalog, organization installation y capability binding.

Hasta que se implemente el nuevo modelo:

- no crear una segunda registry paralela;
- usar migrations compatibles;
- documentar cómo se mapeará cada fila histórica al modelo objetivo;
- no almacenar secrets en `contract`, `config` ni `metadata`;
- conservar `secretsRef` como referencia opaca.

### Paso 4 — Registrar permisos canónicos

Los permisos viven en `core/authz/catalog/*.permissions.js` y se agregan mediante `core/authz/catalog/registry.js`.

Formato actual esperado:

```js
{
  name: 'lms.grades.read',
  description: 'Read grades for authorized resources.',
  domain: 'lms',
  surface: 'organization',
  status: 'planned',
  resource: 'https://civitas.didaxus.com/api',
  consumers: [],
  policyRequirements: [],
  overlayMode: 'restrictable'
}
```

#### Reglas de naming

El validador actual exige nombres con puntos y al menos tres segmentos:

```text
<domain>.<resource>.<action>[.<qualifier>]
```

Ejemplos:

```text
lms.grades.read
lms.grades.manage
crm.contacts.read
support.tickets.update
```

Está prohibido:

- `*`;
- prefijo `organization.`;
- scopes con `:`;
- nombres provider-specific;
- permisos inventados directamente en frontend;
- asignar permisos `planned` a roles activos;
- activar un permiso sin consumer, salvo excepción explícita y temporal.

#### Estados

- `planned`: contrato reservado, todavía no autorizable.
- `active`: tiene consumers reales, tests y runtime implementado.
- `deprecated`: requiere `replacement` y plan de migración.

No se debe cambiar a `active` solo para satisfacer un test o mostrar una pantalla.

#### Registro en roles

Las asignaciones viven en:

- `core/authz/roles/global-role-permissions.js`
- `core/authz/roles/organization-role-permissions.js`

Agregar potencial RBAC no concede acceso. La operación seguirá necesitando PBAC y ABAC según `CIVITAS_AUTHORIZATION_POLICY_MODEL.md`.

#### Gap arquitectónico actual

`KNOWN_DOMAINS` aún representa dominios históricos y no coincide exactamente con los diez módulos. La migración debe introducir un mapping explícito, por ejemplo:

```text
billing -> payments
communications/notifications -> shared communication capabilities or module-owned channels
connectors -> platform adapter administration
```

No hacer rename masivo. Crear primero un contrato de ownership y actualizar validators para distinguir:

- module ID;
- permission domain;
- platform domain;
- compatibility domain.

### Paso 5 — Crear el application service

El application service implementa el use case. Debe recibir dependencias explícitas.

Ejemplo conceptual:

```ts
type CreateBookingCommand = {
  organizationId: string;
  actor: PrincipalContext;
  input: CreateBookingInput;
  idempotencyKey?: string;
};

function createBookingService({
  bookingRepository,
  schedulingPort,
  authorization,
  outbox,
  audit,
}: Dependencies) {
  return async function createBooking(command: CreateBookingCommand) {
    // validate contract
    // verify module/capability availability
    // authorize
    // execute domain operation
    // persist state + outbox atomically
    // return provider-neutral result
  };
}
```

Debe evitar service locator dentro del dominio:

```js
// Evitar
getConnector(orgId, 'scheduling')
```

La selección del binding debe realizarse en la composition/application boundary y entregar un port tipado al service.

### Paso 6 — Integrar autorización

El backend actual dispone de `requireAuthorization`, `authorize`, policy registry y providers. La ruta debe declarar server-side:

- permission;
- actionId;
- surface;
- operation;
- policies;
- target/resource resolvers;
- audit intent, cuando aplique.

Ejemplo conceptual usando el patrón actual:

```js
requireAuthorization({
  permission: 'scheduling.bookings.create',
  actionId: 'scheduling.booking.create',
  surface: 'organization',
  operation: 'create',
  policies: [
    'same-organization',
    'membership-required',
    'authorization-snapshot-current',
  ],
  resourceResolver,
  auditIntentResolver,
})
```

#### Condición modular adicional

La evolución debe introducir un provider/policy para verificar:

- módulo instalado;
- estado operativo permitido;
- capability declarada;
- binding requerido disponible;
- versión compatible.

Esto debe integrarse al policy engine; no debe implementarse como `if` disperso en cada controller.

#### Data scope

Cuando la operación afecta recursos tenant-scoped:

- declarar `requiresDataScope` en screen/action si aplica;
- usar adapter de data scope provider-neutral;
- filtrar listas antes de devolverlas;
- validar mutaciones antes y después cuando el cambio pueda sacar el recurso del scope;
- no confiar en IDs enviados por el cliente.

El registry actual rechaza capabilities provider-specific y ya existe `createLmsDataScopeAdapter`. Los nuevos adapters de scope deben seguir la misma interfaz y agregar contract tests.

### Paso 7 — Definir ports y adapters

El dominio/application service depende de un port, no del SDK del proveedor.

```ts
interface SchedulingBookingPort {
  create(input: CanonicalBookingInput): Promise<CanonicalBooking>;
  cancel(input: CanonicalCancelInput): Promise<CanonicalBooking>;
  health(): Promise<AdapterHealth>;
}
```

Un adapter:

- traduce input canónico a provider API;
- traduce respuesta a modelo canónico;
- normaliza errores;
- aplica timeout;
- soporta idempotencia cuando el proveedor lo permita;
- emite métricas seguras;
- no decide permisos;
- no conoce navegación;
- no expone secrets;
- no devuelve payloads crudos sin validar.

Estructura objetivo sugerida:

```text
backend/modules/<module>/
  application/
  domain/
  contracts/
  ports/
  adapters/
  events/
  api/
  mcp/
  tests/
```

La estructura física puede evolucionar. Lo obligatorio es la dirección de dependencias:

```text
delivery -> application -> domain/ports <- adapters
```

Nunca:

```text
domain -> provider SDK
module A -> adapter de module B
frontend -> provider API
```

### Paso 8 — Persistencia y migrations

Antes de crear una tabla, clasificarla:

1. **canonical local operational state**: Civitas la posee.
2. **read model/projection**: derivada y reconstruible.
3. **technical mapping**: IDs Civitas/proveedor.
4. **provider cache/snapshot**: no es verdad canónica.
5. **audit/outbox**: append-oriented y operacional.

Reglas:

- todas las tablas tenant-scoped deben incluir `logto_organization_id` o FK tenant equivalente;
- índices y uniques deben incluir tenant cuando el ID no sea global;
- evitar cascades que borren historia/auditoría;
- usar migrations versionadas e idempotentes según el patrón del repo;
- agregar schema guard y migration check;
- no usar JSONB como sustituto indefinido de un modelo relacional estable;
- JSONB es válido para extension/config metadata validada;
- secrets solo por `secretsRef`;
- los provider IDs pertenecen a mappings técnicos.

#### Modelo modular objetivo

```text
module_catalog
organization_modules
capability_catalog
adapter_catalog
organization_capability_bindings
module_outbox_events / shared integration outbox
module_inbox_receipts
```

Durante la transición, preferir evolución compatible de:

- `registry_capabilities`;
- `registry_adapters`;
- `registry_connectors`;
- `registry_connector_bindings`;
- `organization_runtime_state`;
- `operational_operations`;
- `authorization_outbox_events`.

No crear tablas duplicadas hasta tener migration mapping y ownership claro.

### Paso 9 — Agregar eventos

Los eventos se producen desde application services después de una mutación válida. Cuando la mutación y el evento dependen de la misma transacción, usar transactional outbox.

Naming:

```text
<module>.<aggregate>.<past-tense-event>.v<major>
```

Ejemplos:

```text
scheduling.booking.created.v1
payments.checkout.completed.v1
lms.grade.updated.v1
crm.contact.tagged.v1
```

No usar nombres de comando como evento:

```text
scheduling.create_booking
```

Envelope mínimo:

```ts
type IntegrationEvent<TPayload> = {
  eventId: string;
  eventType: string;
  schemaVersion: string;
  occurredAt: string;
  organizationId: string;
  aggregateType: string;
  aggregateId: string;
  actor: ActorReference | SystemActorReference;
  correlationId: string;
  causationId?: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  payload: TPayload;
};
```

El código actual de autorización demuestra el patrón correcto: registry de eventos, redacción, retry policy y escritura de mutación + version + outbox + audit en una transacción.

Los módulos deben generalizar ese patrón, no copiarlo ad hoc.

#### Consumers

Todo consumer debe:

- validar schemaVersion;
- ser idempotente;
- registrar receipt/inbox o mecanismo equivalente;
- distinguir retryable de terminal errors;
- preservar correlationId;
- aplicar tenant context;
- usar system principal auditable;
- no ejecutar con autorización implícitamente omitida;
- enviar fallos terminales a DLQ o estado reconciliable.

Los provider webhooks son inputs. Deben verificarse, normalizarse y luego convertirse en comandos o eventos Civitas. Nunca republicar payload crudo como evento canónico.

### Paso 10 — Exponer REST API

La REST API es delivery, no dominio.

Una ruta debe:

1. autenticar;
2. resolver tenant;
3. validar request schema;
4. declarar autorización/policies;
5. construir command/query;
6. llamar application service;
7. mapear resultado a response contract;
8. normalizar errores;
9. incluir correlation/decision identifiers cuando corresponda.

Convención objetivo:

```text
/api/v1/o/:organizationId/<module>/<resource>
```

La ruta exacta debe coordinarse con los contratos existentes y no se adopta automáticamente sin ADR/API review.

Para mutaciones:

- soportar idempotency key cuando exista riesgo de retry;
- documentar optimistic concurrency/ETag si aplica;
- no devolver provider secrets o raw payloads;
- usar errores estables y machine-readable;
- evitar 200 con estado ambiguo cuando la operación es async.

### Paso 11 — Exponer MCP tools

MCP es opcional. Una capability puede existir sin MCP.

Un MCP tool debe mapearse uno-a-uno a un use case autorizado y estable. Naming recomendado:

```text
civitas.<module>.<resource>.<operation>
```

Ejemplos:

```text
civitas.crm.contacts.search
civitas.scheduling.booking.create
civitas.support.tickets.read
```

El handler debe:

- autenticar principal agent/user/system;
- resolver organization context explícito;
- validar schema de input;
- resolver delegation/consent cuando aplique;
- ejecutar la misma autorización que REST;
- llamar el mismo application service;
- retornar respuesta provider-neutral;
- limitar datos y pagination;
- auditar tool execution;
- aplicar rate/usage limits;
- impedir prompt-supplied permission escalation.

Prohibiciones:

- tool genérico `execute_sql`;
- tool genérico `call_provider`;
- aceptar provider token en argumentos;
- permitir `organizationId` arbitrario sin vincularlo al principal;
- hacer bypass de ABAC por ser “agente interno”;
- exponer operaciones no disponibles para ninguna superficie humana/sistema sin ADR específico;
- convertir descripciones de tool en política de seguridad.

#### Estado actual del repo

No existe todavía un runtime MCP canónico en el repositorio. Por tanto, el primer MCP implementation PR debe incluir antes:

- transport/runtime decision;
- authentication model;
- principal/delegation contract;
- tool registry schema;
- authorization adapter;
- audit envelope;
- contract tests;
- deployment boundary.

No introducir un MCP server aislado por módulo antes de resolver estos fundamentos compartidos.

### Paso 12 — Agregar screens, actions y navegación

El frontend actual usa:

- `ScreenDefinition`;
- `ActionDefinition`;
- `defineScreen`;
- `defineActions`;
- `visualRegistry`;
- `routeCatalog`;
- `build-navigation-tree`;
- `build-breadcrumbs`;
- `validateVisualRegistry`;
- `validate-navigation-contract.mjs`.

Este sistema se conserva.

#### Crear actions

Ejemplo basado en el patrón actual:

```ts
export const bookingActions = defineActions([
  {
    actionId: 'scheduling.booking.create',
    capability: 'scheduling',
    access: {
      requiredAllPermissions: ['scheduling.bookings.create'],
      policies: ['same-organization'],
      requiresDataScope: true,
    },
    presentation: {
      labelKey: 'actions.scheduling.booking.create',
      responsivePlacement: 'primary',
    },
  },
]);
```

#### Crear screen

```ts
export const bookingsScreen = defineScreen({
  screenId: 'scheduling-bookings',
  capability: 'scheduling',
  route: routeCatalog.schedulingBookings,
  navigation: {
    menuKey: 'scheduling.bookings',
    labelKey: 'navigation.scheduling.bookings',
    breadcrumbKey: 'breadcrumbs.scheduling.bookings',
    iconKey: 'calendar',
    responsiveGroup: 'operations',
    order: 20,
  },
  access: {
    requiredAllPermissions: ['scheduling.bookings.read'],
    policies: ['same-organization'],
    requiresOrganizationContext: true,
    requiresDataScope: true,
  },
  organizationCustomization: {
    visibility: 'hideable',
    order: 'customizable',
  },
  actions: ['scheduling.booking.create'],
});
```

#### Registrar

Agregar screens/actions al aggregate registry. Mientras sea manual, todo PR debe actualizar `frontend/src/authorization/registry/index.ts` y sus tests. La evolución objetivo es generar este aggregate desde module manifests validados, pero no se debe implementar generación parcial sin contract parity.

#### Condición de módulo activo

Los contratos actuales conocen `capability`, permissions y feature flags, pero no modelan todavía un module lifecycle canónico. Antes de montar navegación dinámica por módulo se debe extender `VisualAuthorizationContext` o su read model para incluir availability efectiva, por ejemplo:

```ts
moduleAvailability: {
  [moduleId]: {
    state: 'active' | 'degraded' | 'suspended' | 'disabled';
    capabilities: string[];
    version: string;
  };
}
```

El frontend no consulta tablas ni connectors. Consume el contexto efectivo del backend.

#### Gaps actuales a resolver

`CapabilityKey` y `knownCapabilities` todavía contienen claves históricas como `email`, `storage`, `notifications`, `automation`, `owner` y `account`, y faltan módulos objetivo como `marketing`, `hr` y `reports`.

No reemplazar el union manual de manera destructiva. El plan correcto:

1. clasificar keys en business modules, platform capabilities y surfaces;
2. introducir tipos separados;
3. migrar `ScreenDefinition.capability` a `moduleId` + optional `capabilityId`, si el diseño final lo confirma;
4. actualizar validators;
5. migrar screens existentes;
6. eliminar compatibilidad después de CI verde.

### Paso 13 — Tests y gates obligatorios

Cada vertical slice debe incluir como mínimo:

#### Contract tests

- capability ID y ownership;
- permission naming/status/consumer;
- role assignment cuando aplique;
- module manifest validity;
- API request/response schema;
- event schema/version;
- adapter contract;
- screen/action registry;
- route builders/placeholders;
- tenant isolation.

#### Authorization tests

- sin module activation: deny;
- sin permission: deny;
- sin ceiling: deny;
- sin activation: deny;
- sin scope requerido: deny/empty según contrato;
- recurso cross-tenant: deny antes de exponer datos;
- multirol: no privilege borrowing;
- stale authorization snapshot: deny;
- system/event principal: política explícita;
- MCP principal: mismos límites.

#### Adapter tests

- mapping input/output;
- timeout;
- retry classification;
- provider error normalization;
- unsupported operation;
- malformed provider payload;
- secret redaction;
- health state;
- idempotency behavior.

#### Event tests

- mutación y outbox atómicos;
- schema version;
- redacción;
- duplicate delivery;
- retry;
- terminal failure/DLQ;
- cross-tenant rejection;
- correlation propagation.

#### Frontend tests

- registry compiles;
- no duplicate screen/action/menu/route;
- permissions activas;
- policies conocidas;
- direct URL y menú coherentes;
- module disabled removes navigation but API sigue deny server-side;
- organization placeholders nunca llegan a navegación real;
- breadcrumbs salen del registry.

#### Validaciones existentes a ejecutar

Según el área modificada:

```bash
npm run authz:naming:check
npm run test:authz:naming
node --test core/authz/contract-tests/authz-contract.test.js
npm run validate:frontend-authz
npm run validate:visual-contract
node frontend/scripts/validate-navigation-contract.mjs
npm test
```

Además se deben agregar nuevos scripts de module contract, event contract y module migration check antes de activar el runtime modular.

---

## 4. Checklist por tipo de cambio

### 4.1 Nuevo módulo

Un módulo adicional a los diez iniciales requiere ADR. Para un módulo existente:

- [ ] module owner confirmado;
- [ ] capability map;
- [ ] permissions y policies;
- [ ] data classification;
- [ ] dependencies sin ciclos;
- [ ] lifecycle tenant;
- [ ] API contributions;
- [ ] event contributions;
- [ ] adapters;
- [ ] UI contributions;
- [ ] migrations;
- [ ] audit/observability;
- [ ] rollout plan;
- [ ] compatibility plan.

### 4.2 Nueva capability

- [ ] provider-neutral ID;
- [ ] module owner único;
- [ ] operations definidas;
- [ ] adapter requirement;
- [ ] authorization requirements;
- [ ] data scope strategy;
- [ ] versioning policy;
- [ ] failure semantics;
- [ ] contract test.

### 4.3 Nuevo adapter

- [ ] implementa port existente;
- [ ] no modifica contrato canónico;
- [ ] config schema sin secrets;
- [ ] `secretsRef`;
- [ ] health;
- [ ] timeout/retry/circuit breaker;
- [ ] error normalization;
- [ ] mapping tests;
- [ ] provider rate-limit handling;
- [ ] observability/redaction.

### 4.4 Nuevo permiso

- [ ] naming válido;
- [ ] domain/ownership claro;
- [ ] status inicial `planned`;
- [ ] resource canónico;
- [ ] surface correcta;
- [ ] policyRequirements;
- [ ] overlayMode;
- [ ] consumer real antes de `active`;
- [ ] role potential explícito;
- [ ] PBAC/ABAC definidos;
- [ ] Logto plan/seed;
- [ ] contract tests.

### 4.5 Nuevo evento

- [ ] past tense;
- [ ] module namespace;
- [ ] schema version;
- [ ] aggregate;
- [ ] tenant ID;
- [ ] event/correlation IDs;
- [ ] sensitivity;
- [ ] redaction;
- [ ] outbox transaction;
- [ ] consumer idempotency;
- [ ] retry/DLQ;
- [ ] compatibility policy.

### 4.6 Nuevo MCP tool

- [ ] capability/use case existente;
- [ ] input/output schema;
- [ ] principal y tenant resolution;
- [ ] delegation/consent;
- [ ] canonical permission;
- [ ] policies/data scope;
- [ ] same application service as REST/system;
- [ ] audit;
- [ ] rate limits;
- [ ] safe pagination;
- [ ] no secrets/raw provider access;
- [ ] tool contract tests.

### 4.7 Nueva pantalla o navegación

- [ ] route catalog entry;
- [ ] route builder para tenant IDs;
- [ ] action definitions;
- [ ] screen definition;
- [ ] active permissions;
- [ ] known policies;
- [ ] capability/module classification;
- [ ] registry aggregation;
- [ ] breadcrumb;
- [ ] icon catalog;
- [ ] module availability effective;
- [ ] direct URL behavior;
- [ ] visual/navigation validators.

---

## 5. Anti-patterns que bloquearán el PR

Un reviewer debe rechazar cambios que introduzcan:

- provider name como module/capability/permission;
- nueva fuente de verdad de roles o permisos fuera de `core/authz`;
- lectura de JWT crudo en frontend para decidir acceso;
- sidebar hardcoded por módulo;
- REST y MCP con lógica divergente;
- MCP loopback hacia REST público;
- acceso de event consumer sin principal/policy explícita;
- secrets en JSONB, manifest, logs o eventos;
- webhook payload convertido directamente en evento canónico;
- tabla tenant-scoped sin tenant constraint;
- binding global aplicado a un tenant sin contrato explícito;
- boolean `enabled` como único lifecycle operacional;
- adapter importado directamente por otro módulo;
- permiso `active` sin consumer;
- ruta con `:organizationId` materializada sin builder;
- pantalla con permiso inexistente o planned;
- módulo deshabilitado que todavía aparece por fallback de UI;
- error provider-specific expuesto como contrato público;
- migration que infiere silenciosamente ownership o tenant cuando es ambiguo.

---

## 6. Estrategia de migración desde el repositorio actual

La implementación debe ocurrir en etapas controladas.

### Etapa A — Contratos ejecutables

1. schema de module manifest;
2. catálogo fijo de diez módulos;
3. mapping de domains/capabilities históricos;
4. validators y contract tests;
5. dependency cycle validation.

### Etapa B — Lifecycle y persistencia

1. organization module installation;
2. lifecycle state machine;
3. capability binding model;
4. migration desde registries actuales;
5. secret boundary;
6. read model para availability.

### Etapa C — Application runtime

1. module registry runtime;
2. capability resolver;
3. typed ports;
4. adapter composition;
5. health and degraded-state propagation;
6. authorization provider/policy de módulo.

### Etapa D — Eventos compartidos

1. generic integration-event registry;
2. generalización del outbox existente;
3. inbox/idempotency receipts;
4. retry/DLQ/reconciliation;
5. schema compatibility tests.

### Etapa E — Vertical reference slice

Seleccionar una capability acotada y real. Debe incluir:

- permission;
- policy;
- application service;
- port;
- un adapter;
- REST;
- event;
- screen/action si corresponde;
- optional MCP después de foundation MCP.

No implementar los diez módulos simultáneamente.

### Etapa F — Generación y automatización

Después de tener un vertical slice estable:

- generar aggregate registries desde manifests;
- generar docs/inventory;
- validar drift;
- retirar listas manuales gradualmente;
- mantener artefactos compilados deterministas.

---

## 7. Definition of Done para runtime modular

La foundation modular se considera lista para expansión cuando:

1. existe un catálogo ejecutable de los diez módulos;
2. organization module lifecycle está persistido y auditado;
3. capability resolver es provider-neutral;
4. authorization incorpora module/capability availability sin duplicar RBAC/PBAC/ABAC;
5. adapters se resuelven en composition boundary;
6. eventos usan outbox generalizado e inbox idempotente;
7. REST y MCP comparten application services;
8. frontend consume module availability desde AuthorizationContext/read model;
9. manifests alimentan o validan permissions, APIs, events y UI contributions;
10. CI detecta drift, ciclos, permisos huérfanos, rutas inválidas y provider leakage;
11. un vertical slice real está desplegado y probado multi-tenant;
12. rollback y decommissioning están documentados.

Hasta cumplir esto, Civitas está en transición hacia runtime modular; la documentación no debe presentarlo como completamente implementado.

---

## 8. Plantilla de PR para una capability

Todo PR de implementación debe incluir:

### Motivation

- problema de negocio;
- módulo owner;
- capability y operaciones;
- por qué no se resuelve con capability existente.

### Architecture

- application service;
- port/adapters;
- persistence ownership;
- authorization;
- events;
- API/MCP/UI surfaces;
- dependency graph.

### Security and tenancy

- organization resolution;
- permission;
- PBAC;
- ABAC/data scope;
- secret handling;
- audit;
- cross-tenant tests.

### Compatibility

- migrations;
- legacy mapping;
- event/API versioning;
- rollback;
- deprecation.

### Validation

- commands executed;
- contract tests;
- integration tests;
- deployment evidence;
- known limitations.

---

## 9. Regla final

La arquitectura modular no debe convertirse en otra capa de metadata sin enforcement.

Cada declaración debe tener un consumidor o un validador:

- capability declarada -> resolver/contract test;
- permission declarada -> authz validator y consumer;
- event declarado -> schema registry/outbox/consumer contract;
- route declarada -> route catalog y navigation validator;
- adapter declarado -> port compliance test;
- module lifecycle -> backend policy y frontend read model;
- MCP tool declarado -> tool registry y authorization contract.

Si una declaración no puede verificarse, todavía es documentación de intención y debe permanecer marcada como `planned`. La evolución correcta de Civitas depende de convertir progresivamente esas intenciones en contratos ejecutables, sin romper las garantías ya construidas en autorización, navegación, tenant isolation y observabilidad.