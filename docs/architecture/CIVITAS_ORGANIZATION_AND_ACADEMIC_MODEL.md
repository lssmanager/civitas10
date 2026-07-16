# Civitas — Modelo canónico de organización, académico y alcance

**Estado:** Normativo para Phase 2  
**Fecha:** 2026-07-16  
**Decisiones relacionadas:** #127, #129, #132, #134, #135, #136 y #139.

> Este documento congela la separación entre estructura organizacional, dominio académico, taxonomía, relaciones y alcance ABAC. Un cambio requiere ADR, migración, versión, pruebas de aislamiento tenant y actualización de contratos consumidores.

## 1. Decisiones congeladas

1. El alcance ABAC concreto se asocia a una **membresía‑rol**: `organizationId + membershipId + canonicalRoleId`.
2. El rol canónico define potencial RBAC y estrategia ABAC permitida; no guarda targets individuales.
3. Una persona con varios roles posee rutas separadas; no hay préstamo de permisos o scopes.
4. `AcademicGroup` y `CourseOffering` son entidades de dominio LMS separadas de `OrganizationUnit`, vinculadas a estructura y clasificación.
5. El organigrama muestra un `hierarchyKey` a la vez; la organización es una raíz virtual no editable.
6. El catálogo define dependencias de permisos. Los cambios se aplican mediante cascada guiada, confirmada y transaccional.
7. Taxonomías clasifican; no son jerarquía, roles ni aristas de mando.

## 2. Alcance por membresía‑rol

### 2.1 Forma canónica

```text
RoleDefinition
  → potencial RBAC + estrategia ABAC permitida

MembershipRoleBinding
  → usuario + organización + rol canónico

AuthorizationScopeAssignment
  → MembershipRoleBinding + template + target
```

Ejemplo:

```text
Ana + organization_headteacher
→ academic.subject = mathematics

Ana + organization_groupleader
→ leads(academicGroup:7B)

Ana + organization_teacher
→ teaches(courseOffering:algebra-8A)
→ teaches(courseOffering:algebra-8D)
```

La misma persona puede tener los tres bindings, pero cada request evalúa una ruta completa:

```text
role potential
AND Owner Ceiling
AND Tenant Activation
AND strategy/scope of the same MembershipRoleBinding
```

No existe una unión de “permiso de Teacher” con “scope de Group Leader”.

### 2.2 Lo que no se permite

- scopes mutables directamente sobre el rol global;
- scopes sin rol asociado;
- asignación de targets cross-tenant;
- inferir scope desde alias o nombre de cargo;
- fallback organization-wide al faltar un binding;
- reutilizar el target de un binding para otra ruta de rol.

## 3. Entidades y ownership

| Entidad | Propósito | Owner de datos | No es |
|---|---|---|---|
| `OrganizationUnit` | estructura estable: campus, facultad, departamento, coordinación, área | Organization model | cohorte temporal ni permiso |
| `AcademicGroup` | cohorte con roster y ciclo académico: 7B | LMS/academic domain | nodo de mando |
| `CourseOffering` | asignatura impartida a grupo durante período: Álgebra 8A, 2026-2 | LMS/academic domain | rol ni unidad organizacional |
| `TaxonomyDimensionValue` | clasificación: Matemáticas, Secundaria, Campus Norte | taxonomy contract | arista de organigrama |
| `OrganizationRelationship` | vínculo validado: `teaches`, `leads`, `studies`, `manages` | relationship contract | permiso por sí mismo |
| `MembershipRoleBinding` | responsabilidad de persona en organización | authorization/membership | alias local |

### 3.1 Ejemplo

```text
OrganizationUnit
Universidad
└── Campus Norte
    └── Facultad de Ingeniería
        └── Departamento de Matemáticas

AcademicGroup
Grupo 7B
├── campus = Campus Norte
├── grade = 7
├── section = B
└── roster = estudiantes

CourseOffering
Álgebra 8A
├── subject = Algebra
├── academicGroup = 8A
├── term = 2026-2
└── teacher binding = Ana + organization_teacher
```

Una unidad puede etiquetarse con taxonomía y relacionarse con grupos/cursos, pero no absorbe su lifecycle temporal, roster o inscripción.

## 4. Organigrama por hierarchyKey

El canvas representa una sola jerarquía a la vez, elegida por selector:

```text
[Estructura administrativa ▼]
Organización (raíz virtual)
└── Campus Norte
    └── Dirección Administrativa
        └── Talento Humano

[Estructura académica ▼]
Organización (raíz virtual)
└── Campus Norte
    └── Facultad de Ingeniería
        └── Carrera de Sistemas
```

Reglas:

- la raíz virtual identifica a la organización, no es una unidad editable;
- cada `OrganizationUnit` tiene `hierarchyKey`, tipo y `parentUnitId` compatible;
- no se crean ciclos, padres cross-tenant ni relaciones de padre inválidas;
- relaciones transversales se muestran en inspector/lista, no como aristas del árbol;
- el tenant crea/mueve unidades dentro de templates/ceiling autorizados;
- Owner publica templates/tipos permitidos y revisa de forma auditada.

## 5. Dependencias de permisos

El catálogo puede declarar una dependencia dura:

```text
lms.grades.read
└── lms.grades.update
    └── lms.grades.export
```

### 5.1 Activar

Al solicitar `grades.update`, el sistema calcula prerequisitos faltantes y presenta una confirmación explícita:

```text
Activar “Editar notas” también requiere:
✓ Ver notas

[Cancelar] [Activar ambos]
```

### 5.2 Desactivar

Al solicitar desactivar `grades.read`, el sistema calcula dependientes activos:

```text
Desactivar “Ver notas” desactivará:
- Editar notas
- Exportar notas

[Cancelar] [Desactivar 3 permisos]
```

### 5.3 Invariantes

- Nunca se activa/desactiva de forma silenciosa.
- El mismo grafo se aplica a Owner Ceiling y Tenant Activation; la mutación respeta su ownership.
- El backend es la fuente de verdad y ejecuta el batch en transacción.
- La respuesta contiene diff, versión esperada/actual, filas afectadas, reason y resultado.
- Conflicto/version stale: no se aplican cambios parciales.
- Grupo de permisos es una conveniencia visual; las dependencias son del catálogo, no del orden visual.

## 6. Implicaciones para UX y APIs

- Scope assignments selecciona primero el binding `persona + rol`, luego template y target.
- Groups and courses consulta entidades LMS, enlazadas a unidades/taxonomías; no manipula `parentUnitId`.
- Structure and classification edita solo `OrganizationUnit` y tags; responsables aparecen como relaciones.
- Segmentation puede consultar bindings, unidades, grupos, cursos, taxonomías y relaciones permitidas, sin conceder acceso.
- Access explorer muestra cada MembershipRoleBinding por separado en matriz/grafo.
- Cualquier endpoint recibe `organizationId`, valida tenant y devuelve solo datos autorizados.

## 7. Pruebas obligatorias

1. Ana como Headteacher de Matemáticas ve la ruta de ese rol, no 7B por el binding de Group Leader.
2. Ana como Group Leader de 7B no modifica notas si esa ruta no tiene `grades.update`.
3. Ana como Teacher de 8A/8D no obtiene 8B/8C.
4. Un grupo/courso de período cerrado no destruye ni reestructura el organigrama.
5. Un curso no puede convertirse en padre de una unidad organizacional.
6. Un movimiento de unidad que crea ciclo o cruza tenant falla.
7. Activar un permiso dependiente presenta y persiste todos los prerequisitos en una sola transacción.
8. Desactivar un prerequisito exige confirmación y no deja dependientes activos.
9. Ningún binding, grupo, curso, unidad o relación de otro tenant es visible o utilizable.
