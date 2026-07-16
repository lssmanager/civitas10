# Civitas — Plantilla obligatoria: introducción de rol canónico

**Uso:** copiar esta plantilla completa en un ADR/issue antes de introducir, modificar o deprecar un rol.  
**Autoridad:** Owner Global. El tenant no puede crear ni modificar roles canónicos.  
**Contrato rector:** [CIVITAS_AUTHORIZATION_POLICY_MODEL.md](../CIVITAS_AUTHORIZATION_POLICY_MODEL.md).

> No se asigna un rol real en Logto ni se habilita en producción hasta que todos los campos obligatorios estén aprobados y los criterios de cierre se cumplan.

---

## 1. Identidad del cambio

| Campo | Valor |
|---|---|
| ID canónico inmutable | `organization_<nombre>` |
| Estado | proposed / approved / active / deprecated |
| Fecha y versión de catálogo | |
| Owner responsable | |
| ADR/issue relacionado | |
| Reemplaza/depreca | Ninguno / ID y plan de migración |
| Rol global u organización | |
| Justificación de producto | |

### Regla de nombre

- El ID expresa una responsabilidad reutilizable, no el nombre local de un cargo.
- Ejemplo correcto: `organization_groupleader`.
- Ejemplo incorrecto: `organization_rector_colegio_x`.
- Los nombres locales (“Rector”, “Tutor”, “Director de grupo”) son aliases configurables por tenant.

## 2. Límites del rol

Describir con frases verificables:

- **Responsabilidad:**  
- **Lo que este rol sí debe poder hacer:**  
- **Lo que este rol nunca puede hacer:**  
- **Qué otros roles puede acumular:**  
- **Qué acceso no debe ampliarse al acumular roles:**  

No usar frases vagas como “gestiona el área” sin especificar recursos, acciones y scope.

## 3. Contrato RBAC

| Permission ID canónico | Estado del permiso | Potencial del nuevo rol | Justificación |
|---|---|---:|---|
| `domain.resource.read` | active/planned | sí/no | |
| `domain.resource.update` | active/planned | sí/no | |

Reglas:

1. Solo IDs existentes del catálogo.
2. Nunca wildcard, prefijo abierto ni permiso construido dinámicamente.
3. No promover un permiso `planned` a `active` como efecto colateral.
4. Enumerar explícitamente las capacidades denegadas de alto riesgo.
5. Si se necesita un permiso nuevo, abrir/adjuntar primero su cambio de catálogo.

## 4. Contrato PBAC

| Parámetro | Decisión |
|---|---|
| ¿Owner puede ofrecer este rol a toda organización? | sí/no/por perfil |
| Owner Ceiling inicial por permiso | listado explícito |
| Tenant Activation por defecto | ninguna / Bootstrap Profile específico |
| ¿Requiere Bootstrap Profile? | sí/no |
| Roles provisionables por dominio/SSO | listado o ninguno |
| Reglas de deprecación/revocación | |

Recordatorio: Ceiling permitido no concede acceso; Tenant Activation tampoco basta sin ABAC cuando la capacidad es scoped.

## 5. Contrato ABAC

| Campo | Definición |
|---|---|
| Estrategia ABAC global | ID estable, por ejemplo `group_leadership` |
| Tipo de scope | dimension / unit / resource / relationship |
| Dimensiones permitidas | |
| Relaciones que generan candidatos | |
| Relaciones que **no** conceden acceso | |
| Recurso protegido y atributos comprobados | |
| Comportamiento sin scope | deny / lista vacía segura |
| Comportamiento cross-tenant | deny |

La estrategia debe ser reutilizable y registrada por Owner. El tenant configura valores, unidades y relaciones válidas; no inventa una semántica de scope local.

## 6. Multirol: casos de no-préstamo

Definir al menos tres casos, incluidos uno permitido y dos denegados:

| Roles del usuario | Solicitud | Ruta completa que permite/deniega | Resultado |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

La regla es:

```text
allow = OR de rutas completas:
catálogo activo ∧ potencial RBAC ∧ Owner Ceiling ∧ Tenant Activation ∧ ABAC del mismo rol
```

Está prohibido combinar permiso de un rol con scope de otro.

## 7. Logto y aprovisionamiento

| Flujo | ¿Puede asignar el rol? | Condiciones |
|---|---:|---|
| Wizard/bootstrap | sí/no | |
| Default organization roles | sí/no | |
| Email-domain provisioning | sí/no | dominio verificado + mapeo tenant |
| Enterprise SSO/JIT | sí/no | IdP aprobado + claim mapeado |
| Asignación manual tenant | sí/no | actor autorizado + auditoría |

El provisioning crea membresía y candidato RBAC; no omite PBAC ni ABAC. Nunca puede asignar `owner_global` ni permisos/ceilings/scopes desde claims externos.

## 8. Datos, APIs y frontend afectados

- Catálogo/validadores:
- Configuración Logto:
- Migraciones:
- Servicios/evaluador RBAC:
- Servicios/evaluador PBAC:
- Estrategia ABAC y relaciones:
- Endpoints/OpenAPI:
- Authorization Context / Screen-Action registry:
- UI de miembros, aliases, read-only y data-scope:
- Auditoría/outbox/versionado:
- Documentación:

## 9. Amenazas y regresiones que deben probarse

Marcar y completar resultados:

- [ ] El rol sin Owner Ceiling recibe 403.
- [ ] El rol con ceiling y sin Tenant Activation recibe 403.
- [ ] El rol con RBAC/PBAC y sin scope requerido no recibe acceso global.
- [ ] El rol solo accede a recursos de su organización.
- [ ] Una relación no registrada no concede acceso.
- [ ] Una relación/scope cross-tenant es rechazada.
- [ ] Un permiso de otro rol no se combina con el scope de este rol.
- [ ] Retirar activation, relación o scope revoca acceso.
- [ ] URL directa y API aplican la misma decisión que la UI.
- [ ] Provisioning de dominio/SSO no crea privilegios efectivos implícitos.
- [ ] Cambios generan auditoría, policy version e invalidación de contexto.
- [ ] Build, lint, contratos y tests de aislamiento tenant pasan.

## 10. Criterio de aprobación

No aprobar hasta que:

1. Owner haya aceptado el contrato RBAC/PBAC/ABAC.
2. El rol tenga ID, permisos y estrategia ABAC explícitos.
3. Exista una estrategia de bootstrap/provisioning o esté explícitamente prohibida.
4. Los casos multirol estén cubiertos por tests.
5. La migración y el rollback/deprecación estén definidos.
6. El cambio sea revisado por CODEOWNERS de autorización.
