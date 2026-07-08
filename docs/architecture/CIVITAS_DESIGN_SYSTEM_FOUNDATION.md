# Civitas Design System Foundation

> Documento canónico para la foundation visual de Civitas. Define qué archivos son fuente de verdad, qué tokens existen hoy, cómo deben consumirse, qué extensiones se autorizan y cómo debe evolucionar la base hacia un design system reusable sin romper el contrato actual.

## 1. Propósito

Este documento formaliza tres capas que Civitas ya tiene, pero que todavía necesitan un contrato cerrado:

1. `Design Tokens`
2. `Component Library / UI Kit`
3. `Design System Foundation / Base Layer`

El objetivo no es rediseñar el sistema desde cero. El objetivo es **cerrar la taxonomía**, **fijar la fuente canónica**, **explicar el consumo correcto** y **evitar que vuelvan a aparecer tokens, clases o componentes paralelos**.

## 2. Fuente Canónica

La parte visual de Civitas queda formalmente estructurada así:

### 2.1 Base tokens

Archivo canónico:

- `frontend/src/styles/tokens.css`

Aquí viven únicamente:

- spacing
- typography scale
- radius scale
- control heights
- layout dimensions
- breakpoints
- z-index
- border width

Regla: si un valor **no cambia entre light y dark**, pertenece aquí.

### 2.2 Theme tokens

Archivo canónico:

- `frontend/src/styles/theme.css`

Aquí viven únicamente:

- superficies
- texto
- bordes
- color de marca
- colores semánticos
- focus
- shadows

Regla: si un valor **sí cambia entre light y dark**, pertenece aquí.

### 2.3 Primitive CSS layer

Archivos canónicos:

- `frontend/src/styles/primitives.css`
- `frontend/src/styles/layout.css`
- `frontend/src/styles/dashboard.css`

Aquí viven:

- clases base del sistema
- layout primitives
- estados compartidos
- reglas de composición visual entre tokens y componentes

Regla: esta capa **consume tokens**; no redefine escalas visuales por fuera del contrato.

### 2.4 React component library

Directorio canónico:

- `frontend/src/shared/ui/`

Punto de entrada:

- `frontend/src/shared/ui/index.ts`

Esta capa envuelve y estandariza el uso de las clases base para React.

Regla: los componentes de `shared/ui` **no inventan color, spacing, radius ni shadow inline**. Deben apoyarse en:

- tokens
- clases de `primitives.css`
- layout primitives existentes

## 3. Decisión de Taxonomía

La taxonomía final debe seguir **la convención real del repo**, no la de los mockups históricos.

### 3.1 Convención cerrada

La convención canónica de Civitas queda así:

- foundation scale: `--civitas-space-*`, `--civitas-font-*`, `--civitas-radius-*`
- surfaces: `bg`, `surface`, `surface-raised`, `surface-subtle`, `surface-translucent`
- borders: `border`, `border-strong`
- text: `text`, `body`, `muted`, `muted-strong`
- semantic families: `{intent}`, `{intent}-strong`, `{intent}-soft`, `{intent}-muted`
- brand family: `primary`, `primary-strong`, `primary-soft`, `primary-muted`, `primary-contrast`

### 3.2 Decisión importante

**No se adopta el sistema viejo** basado en:

- `text-muted / text-hint`
- `border / border-mid / border-hi`
- `surface-0 ... surface-4`
- `success-bg / success-border / success-text`

Ese vocabulario puede existir en material previo, pero **no es la convención canónica del repo actual**.

### 3.3 Regla de no mezcla

No se permite mezclar dos taxonomías activas a la vez.

Por tanto:

- si el repo usa `success-soft`, no se introduce `success-bg`
- si el repo usa `muted-strong`, no se introduce `text-hint` como eje competidor
- si el repo usa `surface-subtle`, no se introduce `surface-soft-2`

Si un nombre nuevo no encaja en la convención actual, se rechaza.

## 4. Contrato Actual de Tokens

Esta sección documenta **lo que existe hoy en el repo** y debe tratarse como canónico.

### 4.1 Tokens de foundation en `tokens.css`

#### Spacing

- `--civitas-space-0`
- `--civitas-space-1`
- `--civitas-space-2`
- `--civitas-space-3`
- `--civitas-space-4`
- `--civitas-space-5`
- `--civitas-space-6`
- `--civitas-space-8`
- `--civitas-space-10`
- `--civitas-space-12`

#### Typography

- `--civitas-font-xs`
- `--civitas-font-sm`
- `--civitas-font-md`
- `--civitas-font-lg`
- `--civitas-font-xl`
- `--civitas-font-2xl`
- `--civitas-font-3xl`
- `--civitas-font-4xl`

#### Radius

- `--civitas-radius-sm`
- `--civitas-radius-md`
- `--civitas-radius-lg`
- `--civitas-radius-xl`
- `--civitas-radius-pill`

#### Dimensions and layout

- `--civitas-control-height`
- `--civitas-control-height-sm`
- `--civitas-control-height-lg`
- `--civitas-container-max`
- `--civitas-readable-max`

#### Breakpoints

- `--civitas-breakpoint-sm`
- `--civitas-breakpoint-md`
- `--civitas-breakpoint-lg`
- `--civitas-breakpoint-xl`

#### Z-index and misc

- `--civitas-z-topbar`
- `--civitas-z-sticky-action`
- `--civitas-z-overlay`
- `--civitas-border-width`

### 4.2 Theme tokens en `theme.css`

#### Surfaces

- `--civitas-bg`
- `--civitas-surface`
- `--civitas-surface-raised`
- `--civitas-surface-subtle`
- `--civitas-surface-translucent`

#### Borders

- `--civitas-border`
- `--civitas-border-strong`

#### Text

- `--civitas-text`
- `--civitas-body`
- `--civitas-muted`
- `--civitas-muted-strong`

#### Brand

- `--civitas-primary`
- `--civitas-primary-strong`
- `--civitas-primary-soft`
- `--civitas-primary-muted`
- `--civitas-primary-contrast`

#### Info

- `--civitas-info`
- `--civitas-info-strong`
- `--civitas-info-soft`
- `--civitas-info-muted`

#### Success

- `--civitas-success`
- `--civitas-success-strong`
- `--civitas-success-soft`
- `--civitas-success-muted`

#### Warning

- `--civitas-warning`
- `--civitas-warning-strong`
- `--civitas-warning-soft`
- `--civitas-warning-muted`

#### Danger

- `--civitas-danger`
- `--civitas-danger-strong`
- `--civitas-danger-soft`
- `--civitas-danger-muted`

#### Neutral

- `--civitas-neutral`
- `--civitas-neutral-strong`
- `--civitas-neutral-soft`
- `--civitas-neutral-muted`

#### Interaction and elevation

- `--civitas-disabled`
- `--civitas-focus`
- `--civitas-shadow`
- `--civitas-shadow-raised`

## 5. Component Library Actual

Los exports actuales de `frontend/src/shared/ui/index.ts` son:

- `ActionBar`
- `AlertStrip`
- `DataTable`
- `EmptyState`
- `FormField`
- `FormGrid`
- `KpiGrid`
- `MetricCard`
- `NavCollapse`
- `PageHeader`
- `SectionCard`
- `StatusPill`
- `Stepper`

Estos componentes ya constituyen una **component library real**.

La regla contractual de esta capa es:

- si una necesidad se resuelve con uno de estos componentes, se reutiliza
- si hace falta variar layout o intención, se extiende el componente o se agrega una variante
- no se crea una implementación paralela en una página porque “era más rápido”

## 6. Cómo se Deben Consumir los Tokens

### 6.1 En CSS

Correcto:

```css
.civitas-card {
  background: var(--civitas-surface);
  border: var(--civitas-border-width) solid var(--civitas-border);
  border-radius: var(--civitas-radius-lg);
  box-shadow: var(--civitas-shadow);
}
```

Incorrecto:

```css
.civitas-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}
```

### 6.2 En React

Correcto:

- usar `SectionCard`, `MetricCard`, `FormField`, `StatusPill`, `PageHeader`
- pasar contenido, estado, acciones o variantes
- dejar que el componente resuelva la implementación visual

Incorrecto:

- crear una card inline con clases improvisadas
- aplicar colores inline en JSX
- meter spacing/radius/shadow hardcodeado en cada pantalla

### 6.3 En Tailwind

Tailwind existe en el repo, pero **no es la fuente de verdad del sistema visual**.

Tailwind sirve para:

- composición
- layout rápido
- utilidades menores

Tailwind no debe convertirse en una segunda taxonomía de diseño paralela a `--civitas-*`.

Eso significa:

- sí a utilidades de layout
- no a decidir la identidad visual con clases de color arbitrarias
- no a reemplazar tokens de Civitas por valores inline de Tailwind cuando ya existe un token canónico

## 7. Cómo se Deben Reutilizar los Componentes

### 7.1 Orden de consumo correcto

El orden correcto de decisión siempre es:

1. ¿Ya existe un componente en `shared/ui`?
2. Si no existe, ¿ya existe una primitive class en `primitives.css` o `layout.css`?
3. Si no existe, ¿ya existe un token que cubre la necesidad?
4. Solo entonces se diseña una extensión nueva.

### 7.2 Regla de extensiones

Una extensión válida:

- reusa tokens existentes
- reusa convenciones existentes
- no introduce una taxonomía visual competidora
- tiene un consumidor real

Una extensión inválida:

- crea un color semántico sin familia consistente
- agrega `-bg/-text/-border` a un sistema que ya usa `-soft/-muted/-strong`
- duplica un componente existente con otro nombre

## 8. Qué Falta para Cerrar el Contrato por Completo

El repo ya tiene foundation, pero todavía faltan piezas para que el contrato quede realmente endurecido.

### 8.1 Falta una tabla formal token por token

Hace falta documentar cada token con:

- token
- propósito
- light value
- dark value
- componente o primitive que lo consume
- estado: `canonical`, `alias`, `deprecated`, `proposed`

Este documento cierra la estructura y el criterio. La tabla exhaustiva puede crecer a partir de aquí.

### 8.2 Falta cubrir algunos estados de interacción como tokens explícitos

Recomendados para agregar sin romper la convención actual:

- `--civitas-hover-surface`
- `--civitas-hover-primary`
- `--civitas-overlay-backdrop`
- `--civitas-selection-surface`
- `--civitas-icon-muted`
- `--civitas-icon-strong`
- `--civitas-shadow-sm`
- `--civitas-shadow-md`
- `--civitas-shadow-lg`

Regla: estos nombres deben alinearse con el vocabulario actual del repo.

### 8.3 Falta documentar consumo por componente

Por ejemplo:

- `PageHeader` consume `civitas-eyebrow`, `civitas-page-title`, `civitas-page-description`
- `StatusPill` consume familia semántica de `success/warning/danger/neutral`
- `FormField` consume labels, hints, errors y estados de input
- `SectionCard` consume superficie, borde, spacing y shadow base

Esto debe quedar documentado para que la library no derive con el tiempo.

## 9. Qué No Se Debe Reintroducir

No se debe volver a:

- la familia vieja tipo `--civitas-primary-mid`, `--civitas-accent-light`, `--civitas-text-hint`, `--civitas-border-mid`, `--civitas-glass-*`
- aliases tipo Bootstrap
- tokens duplicados solo para “hacer más intuitivo” el naming
- gradientes como base del sistema
- glassmorphism como primitive oficial

Esos recursos pueden existir en mockups históricos, pero no deben gobernar el repo productivo actual.

## 10. Gobernanza

Toda evolución del sistema visual debe seguir esta secuencia:

1. Se valida que el caso no esté cubierto por un token existente.
2. Si falta un token, se agrega en el archivo correcto:
   - `tokens.css` si no depende del tema
   - `theme.css` si sí depende del tema
3. Se actualiza esta documentación en la misma entrega.
4. Se actualiza la primitive o el componente que lo consume.
5. No se aprueba un token nuevo sin consumidor real.

## 11. Estado Objetivo

Con este contrato, Civitas debe operar así:

- `tokens.css` define la escala base
- `theme.css` define la identidad por tema
- `primitives.css` y `layout.css` definen las reglas CSS compartidas
- `shared/ui/` define la librería React reutilizable
- las pantallas solo componen contratos existentes

Cuando esta base necesite ser compartida entre productos, la evolución natural será:

- `packages/design-system`
o
- `packages/ui`

Pero ese movimiento debe ocurrir **después** de cerrar el contrato, no antes.

## 12. Diagnóstico Final

Estado actual:

1. `Design Tokens`: sí
2. `Component Library / UI Kit`: sí
3. `Design System Foundation / Base Layer`: sí
4. `Contrato cerrado y documentado`: parcialmente
5. `Reusable package entre productos`: no todavía

Conclusión:

**Civitas no necesita reinventar su sistema visual. Necesita cerrar el contrato del que ya existe, endurecer su taxonomía y documentar cómo debe consumirse y reutilizarse.**