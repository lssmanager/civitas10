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
- `--civitas-viewport-height`
- `--civitas-sidebar-width`
- `--civitas-sidebar-mobile-width`
- `--civitas-nav-item-padding-x`
- `--civitas-nav-child-indent`
- `--civitas-nav-item-height`
- `--civitas-nav-item-gap`
- `--civitas-nav-icon-size`
- `--civitas-nav-icon-column`
- `--civitas-nav-icon-label-gap`
- `--civitas-nav-chevron-column`
- `--civitas-nav-collapse-button-size`
- `--civitas-nav-scroll-padding`
- `--civitas-nav-mobile-max-height`

#### Breakpoints

- `--civitas-breakpoint-sm`
- `--civitas-breakpoint-md`
- `--civitas-breakpoint-lg`
- `--civitas-breakpoint-xl`

#### Z-index and misc

- `--civitas-z-topbar`
- `--civitas-z-sticky-action`
- `--civitas-z-overlay`
- `--civitas-z-popover`
- `--civitas-z-tooltip`
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

- `--civitas-disabled` (canonical)
- `--civitas-focus` (canonical)
- `--civitas-hover-surface` (canonical)
- `--civitas-hover-primary` (canonical)
- `--civitas-overlay-backdrop` (canonical)
- `--civitas-selection-surface` (canonical)
- `--civitas-icon-muted` (canonical)
- `--civitas-icon-strong` (canonical)
- `--civitas-shadow-sm` (canonical)
- `--civitas-shadow-md` (canonical)
- `--civitas-shadow-lg` (canonical)
- `--civitas-shadow` (alias to `--civitas-shadow-sm`)
- `--civitas-shadow-raised` (alias to `--civitas-shadow-lg`)

#### Sidebar navigation

- `--civitas-nav-shell-bg` (canonical)
- `--civitas-nav-shell-border` (canonical)
- `--civitas-nav-shell-text` (canonical)
- `--civitas-nav-shell-muted` (canonical)
- `--civitas-nav-shell-brand-bg` (canonical)
- `--civitas-nav-bg` (alias to `--civitas-nav-shell-bg`)
- `--civitas-nav-border` (alias to `--civitas-nav-shell-border`)
- `--civitas-nav-item-bg` (canonical)
- `--civitas-nav-item-bg-hover` (canonical)
- `--civitas-nav-item-bg-active` (canonical)
- `--civitas-nav-item-text` (canonical)
- `--civitas-nav-item-text-active` (canonical)
- `--civitas-nav-item-icon` (canonical)
- `--civitas-nav-item-icon-active` (canonical)
- `--civitas-nav-chevron` (canonical)
- `--civitas-nav-chevron-active` (canonical)
- `--civitas-nav-collapse-bg` (canonical)
- `--civitas-nav-collapse-bg-hover` (canonical)
- `--civitas-nav-collapse-icon` (canonical)
- `--civitas-nav-focus-ring` (canonical)


### 4.3 Floating layer: popover, flyout, tooltip

Esta familia cubre contenido flotante opaco que aparece por encima del contenido base. No reemplaza `--civitas-overlay-backdrop`, que es solo para scrims/backdrops detrás de overlays, ni `--civitas-surface-translucent`, que no debe usarse como fondo del contenido de un popover/flyout.

#### Popover / flyout tokens

- `--civitas-popover-bg` (canonical; siempre opaco)
- `--civitas-popover-border` (canonical)
- `--civitas-popover-text` (canonical)
- `--civitas-popover-shadow` (canonical)
- `--civitas-popover-radius` (canonical; alias semántico a la escala de radius)
- `--civitas-popover-offset` (canonical; alias semántico a la escala de spacing)
- `--civitas-z-popover` (canonical)

#### Tooltip tokens

- `--civitas-tooltip-bg` (canonical)
- `--civitas-tooltip-text` (canonical)
- `--civitas-tooltip-radius` (canonical; alias semántico a la escala de radius)
- `--civitas-tooltip-offset` (canonical; alias semántico a la escala de spacing)
- `--civitas-z-tooltip` (canonical; siempre por encima de popover/flyout)

#### Regla de interacción XOR

Durante Phase 2 `NavCollapse` no expone rail contraído desktop, tooltips de rail ni flyouts de rail. La navegación desktop conserva labels visibles; el drawer mobile mantiene labels accesibles.

#### Tabla de consumo

- `Dropdown` futuro: debe consumir `--civitas-popover-*` y `--civitas-z-popover`; no debe inventar fondo, border, radius ni shadow propios.
- `ConfirmDialog` futuro: si usa una capa flotante no modal o panel auxiliar, debe consumir `--civitas-popover-*`; si usa scrim, el scrim consume `--civitas-overlay-backdrop`, no el panel.
- `Tooltip` futuro: debe consumir `--civitas-tooltip-*` y `--civitas-z-tooltip`.

### 4.4 Addendum — jerarquía de texto, estado semántico y disclosure

Este addendum extiende la foundation visual para pantallas densas en datos y estado, especialmente las vistas del sidebar de gobernanza. Role permissions confirmó tres huecos que no deben resolverse pantalla por pantalla:

- un string técnico (`lms.course_offerings.read`) y un label humano (`lms · course_offerings · read`) no pueden competir con el mismo peso visual;
- cada pantalla no debe inventar badges o paletas ad-hoc para estados como `planned`, `not_configured` o `role_permission_missing`;
- todo chevron visible debe representar un disclosure funcional, no decoración.

#### Jerarquía de texto

| Token | Uso | Ejemplo |
|---|---|---|
| `text-primary` | Label legible que el usuario usa para tomar una decisión | `lms · course_offerings · read`, `Director de Primaria` |
| `text-secondary` | Contexto visible de apoyo, sin protagonismo | subtítulos de pantalla, descripciones de una línea |
| `text-technical` | Identificadores técnicos, IDs, strings dotted y nombres canónicos | `lms.course_offerings.read`, `43dbzvydh55qsbdkntsvn`, `organization_payroll` |

Regla de uso: `text-technical` nunca se muestra en la vista default con el mismo tamaño, peso o jerarquía que `text-primary`. Debe vivir en `title`/tooltip al hover, un ícono de información expandible o una vista de detalle técnico abierta explícitamente por el usuario. No se coloca inline por default en la vista principal.

#### Estado semántico unificado

| Estado | Color | Forma por default | Cuándo usar |
|---|---|---|---|
| `status-ok` | verde | `status-dot` sin texto | Todo conforme, sin acción pendiente |
| `status-warn` | ámbar | `status-dot`; pill textual solo si el label agrega información, como `planned` | Requiere atención pero no bloquea |
| `status-missing` | gris/ámbar tenue | pill textual con label humano, nunca código snake_case crudo | Algo no está concedido o configurado; reemplaza códigos como `role_permission_missing` y `not_configured` |
| `status-blocked` | rojo | pill textual | Bloqueador real que requiere acción |
| `status-planned` | ámbar/violeta | pill textual `planned` | Feature o sección todavía no disponible |

Reglas de uso:

- En navegación, sidebar y nav-items: usar solo `status-dot`; no reintroducir pills textuales repetidas por cada item.
- En contenido principal, cards y filas de tabla: se permiten pills textuales, pero el label siempre debe estar en lenguaje humano. Ejemplo: `role_permission_missing` se presenta como `Sin conceder a este rol` o equivalente de producto.
- Un mismo estado conserva el mismo significado cromático en todas las pantallas. Si `Access explorer` usa verde para una decisión efectiva `ALLOW`, `Audit log` no puede usar ese mismo verde para una semántica distinta.

#### Disclosure: acordeón y colapsables

| Token | Uso |
|---|---|
| `disclosure-chevron-collapsed` | Chevron en rotación base `0°` |
| `disclosure-chevron-expanded` | Chevron rotado según una única convención del producto: `90°` o `180°`, definida una vez y aplicada en todos los disclosure |
| `disclosure-surface-collapsed` | `surface`, elevación base |
| `disclosure-surface-expanded` | `surface-raised`, una elevación por encima para diferenciar visualmente el grupo abierto |

Regla de uso: todo elemento con chevron visual debe tener el toggle funcional acoplado al estado expandido/colapsado. Nunca se permite un chevron puramente decorativo. El default de expansión se decide por volumen real de items, no por token fijo: pocas secciones pueden iniciar abiertas; listas largas deben iniciar colapsadas para evitar scroll infinito.

#### Regla transversal de resumen condicional

Ningún bloque de resumen, diff o detalle técnico se renderiza si no hay contenido real que resumir. Si el contador asociado (`pending`, `blockers`, `results`) es `0`, el bloque completo no se monta: no se muestra vacío, con placeholder ni con dumps de metadata.

#### Aplicación en gobernanza

Este addendum aplica a todas las pantallas del sidebar de gobernanza: Role permissions, Role names, Scope assignments, Structure and classification, Groups and courses, People segmentation, Access explorer, Audit log, Overview y Operations. Al auditar cada pantalla restante, se debe usar esta jerarquía y estos estados antes de definir badges, disclosure o niveles de texto nuevos. Si una pantalla necesita un estado que no existe en la tabla semántica, primero se agrega aquí como token; no se introduce como badge suelto en el componente.

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

### 8.2 Historial: estados de interacción ya cerrados como tokens explícitos

Estos tokens se agregaron a `frontend/src/styles/theme.css` sin romper la convención actual:

- `--civitas-hover-surface`: canonical; light `#e2e8f0`, dark `#334155`.
- `--civitas-hover-primary`: canonical; light `#1d4ed8`, dark `#93c5fd`.
- `--civitas-overlay-backdrop`: canonical; light `rgba(3, 28, 68, 0.45)`, dark `rgba(0, 0, 0, 0.6)`.
- `--civitas-selection-surface`: canonical; light `rgba(37, 99, 235, 0.16)`, dark `rgba(96, 165, 250, 0.24)`.
- `--civitas-icon-muted`: canonical; alias a `--civitas-muted` en ambos temas.
- `--civitas-icon-strong`: canonical; alias a `--civitas-text` en ambos temas.
- `--civitas-shadow-sm`: canonical; light `0 1px 2px rgba(3, 28, 68, .06)`, dark `0 1px 2px rgba(0, 0, 0, .3)`.
- `--civitas-shadow-md`: canonical; light `0 4px 12px rgba(3, 28, 68, .08)`, dark `0 4px 14px rgba(0, 0, 0, .4)`.
- `--civitas-shadow-lg`: canonical; light `0 12px 32px rgba(3, 28, 68, .14)`, dark `0 16px 40px rgba(0, 0, 0, .5)`.

Regla cerrada: estos nombres quedan alineados con el vocabulario actual del repo y no habilitan la reintroducción de taxonomías paralelas.

### 8.3 Consumo por componente documentado

- `ActionBar` consume `civitas-action-bar`, `civitas-bottom-action-bar`, spacing, superficie translúcida, borde fuerte, shadow raised y z-index sticky action.
- `AlertStrip` consume `civitas-alert`, variantes `info/success/warning/danger/neutral` y las familias semánticas `*-soft`, `*-muted`, `*-strong`.
- `DataTable` consume `civitas-table-wrap`, `civitas-table`, superficie subtle, borde, texto muted-strong, spacing y typography sm.
- `EmptyState` consume `civitas-state`, superficie subtle, borde fuerte dashed, muted text, spacing y radius md.
- `FormField` consume `civitas-form-field`, `civitas-form-field-label`, `civitas-form-field-hint`, `civitas-form-field-error`, `civitas-field`, label muted-strong, hint muted, danger-strong y estados focus/disabled.
- `FormGrid` consume `civitas-form-grid`, `civitas-stack-md`, layout grid, gap y breakpoint responsive.
- `KpiGrid` consume `civitas-kpi-grid`, grid responsive, gap y columnas declaradas por `data-cols`.
- `MetricCard` consume `SectionCard`, `civitas-metric-card`, `civitas-metric-label`, `civitas-metric-value`, `civitas-metric-detail`, muted text, text strong y typography de métricas.
- `NavCollapse` consume `civitas-nav-row`, `civitas-primary-nav`, `civitas-nav-link`, `civitas-nav-link-active`, `civitas-nav-link-icon`, `civitas-nav-tree-*`, `--civitas-nav-*`, spacing, typography y sidebar layout tokens.
- `PageHeader` consume `SectionCard`, `civitas-page-header`, `civitas-page-header-inner`, `civitas-eyebrow`, `civitas-page-title`, `civitas-page-description`, primary, text, muted y readable max.
- `SectionCard` consume `civitas-card`, `civitas-card-header`, `civitas-card-title`, `civitas-card-description`, `civitas-card-body-flush`, superficie, borde, radius, spacing y shadow base.
- `StatusPill` consume `civitas-pill`, `civitas-pill-dot`, familia semántica de `success/warning/danger/neutral`, superficie subtle fallback, borde y muted-strong.
- `Stepper` consume `civitas-stepper`, `civitas-stepper-list`, `civitas-stepper-item`, `civitas-stepper-marker`, `civitas-stepper-label`, primary, primary-contrast, success-strong, border, border-strong, surface, muted, text y utilities responsive `civitas-scroll-x`, `civitas-nowrap-children`, `civitas-visually-hidden`.

Esto queda documentado para que la library no derive con el tiempo.

### 8.4 Contrato cerrado de sidebar navigation

El menú lateral queda cerrado como primitive oficial en `frontend/src/styles/layout.css` y wrapper React en `frontend/src/shared/ui/NavCollapse.tsx`.

- Fondo del sidebar: `--civitas-nav-shell-bg`; separación: `--civitas-nav-shell-border`; texto base: `--civitas-nav-shell-text`; texto/iconografía secundaria: `--civitas-nav-shell-muted`; marca/header lateral: `--civitas-nav-shell-brand-bg`. En light theme esta superficie mantiene identidad lateral propia y no hereda el blanco genérico de `--civitas-surface`. No se permiten gradientes, glassmorphism ni sombras ornamentales en el shell.
- Item base: `--civitas-nav-item-bg`, `--civitas-nav-item-text`, `--civitas-nav-item-icon`, `--civitas-nav-item-padding-x`, `--civitas-nav-child-indent`, `--civitas-nav-item-height`, `--civitas-nav-icon-size`, `--civitas-nav-icon-column`, `--civitas-nav-icon-label-gap`, `--civitas-nav-chevron-column`, `--civitas-nav-item-gap` y `--civitas-radius-md`.
- Retícula interna: cada item usa columnas fijas `icon / label / trailing`; el inicio del icono queda gobernado por un único `--civitas-nav-item-padding-x` en header, padres, hijos y estado contraído. El inicio del label queda gobernado por `--civitas-nav-item-padding-x + --civitas-nav-icon-column + --civitas-nav-icon-label-gap`, y el chevron por `--civitas-nav-chevron-column`.
- Jerarquía: `NavCollapse` emite `data-depth`, `data-active`, `data-expanded` y `data-has-children`; depth 0 no suma indent, depth 1 suma `--civitas-nav-child-indent`, y depth 2 suma dos veces ese token. La indentación siempre se suma al padding base, nunca reemplaza `--civitas-nav-item-padding-x`.
- Hover: `--civitas-nav-item-bg-hover`; debe ser sutil y no puede parecer estado activo.
- Active: `--civitas-nav-item-bg-active`, `--civitas-nav-item-text-active`, `--civitas-nav-item-icon-active`; usa una sola lógica tonal basada en el primary oficial, sin degradado, doble borde ni shadow flotante, y no altera columnas, padding ni ancho del item.
- Expanded tree: el grupo usa `civitas-nav-tree-group` y `data-civitas-nav-expanded`; el chevron usa `--civitas-nav-chevron` / `--civitas-nav-chevron-active`, ocupa la columna trailing fija y rota con transición mínima, sin cápsula ni borde decorativo.
- No desktop collapse button: durante Phase 2 no existe `civitas-sidebar-toggle`, rail contraído ni preferencia local de collapsed mode; los labels permanecen visibles en desktop.
- Scroll desktop: `civitas-sidebar` es el shell visual con altura `100vh` + `--civitas-viewport-height` y `overflow: hidden`; la región que scrollea es `civitas-sidebar .civitas-nav-row`, con `min-height: 0`, `overflow-y: auto` y `--civitas-nav-scroll-padding`.
- Scroll tablet/mobile: el drawer fixed usa `--civitas-sidebar-mobile-width`, `100vh` + `--civitas-nav-mobile-max-height`, `overflow: hidden` y conserva `civitas-nav-row` como única región vertical scrolleable del menú. Esto evita que un body/root lock bloquee el scroll interno del panel.
- Focus-visible: `--civitas-nav-focus-ring`; disabled: `--civitas-disabled`.
- No collapsed flyout: los tokens y selectores de flyout de rail se retiran mientras no exista un modo contraído validado.


#### Máquina de estados del sidebar

- `expanded`: `data-civitas-sidebar-state="expanded"`; el shell usa `--civitas-sidebar-width`, labels visibles y navegación inline.
- `expanded`: `data-civitas-sidebar-state="expanded"`; durante Phase 2 desktop usa sidebar expandido fijo sin rail contraído controlado por usuario.
- `mobile-open`: `data-civitas-sidebar-mobile-state="mobile-open"`; drawer visible en mobile/tablet, independiente de cualquier preferencia desktop; no existe preferencia `collapsed` durante Phase 2.

Regla de transición Phase 2: no existe `civitas-sidebar-toggle` ni preferencia desktop persistida. Abrir/cerrar el drawer mobile no escribe estado desktop.

Este contrato aplica en light y dark theme. Cualquier cambio futuro del menú debe ajustar primero estos tokens o primitives; no se aceptan estilos locales ni inline styles para identidad visual.

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

## 12. Tailwind v4, bloques externos y capa reusable — contrato Phase 2

Issues rectores:

- [#111 — hardening contractual de navegación](https://github.com/lssmanager/civitas10/issues/111)
- [#112 — Design Token Standardization & Reusable Component Layer](https://github.com/lssmanager/civitas10/issues/112)
- [#113 — bridge semántico Tailwind v4](https://github.com/lssmanager/civitas10/issues/113)
- [#114 — intake licenciado y provenance](https://github.com/lssmanager/civitas10/issues/114)
- [#115 — visual contract CI](https://github.com/lssmanager/civitas10/issues/115)
- [#116 — hardening de shared/ui](https://github.com/lssmanager/civitas10/issues/116)

### 12.1 Baseline ejecutable

A 2026-07-13 el frontend instala `tailwindcss@4.3.1` y `@tailwindcss/postcss@4.3.1`. El P0 #117 ya reemplazó las directivas v3 por `@import "tailwindcss"` en `frontend/src/index.css` y verificó utilities representativas del CSS emitido (`.text-sm`, `.gap-2`, `.mt-3`, `.flex-wrap`). La adopción completa del sistema visual no se considera cerrada hasta que los workstreams hijos del epic #112 estén implementados, validados en la rama que se mergeará a `main` y conectados a CI.

Tailwind v4 no autoriza crear una segunda fuente de tokens. Permanecen canónicos:

```text
frontend/src/styles/tokens.css
frontend/src/styles/theme.css
frontend/src/styles/primitives.css
frontend/src/styles/layout.css
frontend/src/shared/ui/
```

Queda prohibido crear en paralelo:

```text
frontend/src/design-system/tokens.css
frontend/src/design-system/components/
otro UI kit root
```

### 12.2 Bridge CSS-first

El bridge de Tailwind vive en:

```text
frontend/src/styles/tailwind-theme.css
```

Su única responsabilidad es exponer tokens existentes como namespaces semánticos de Tailwind:

```text
--civitas-* → @theme inline → utilities semánticas
```

Ejemplo normativo:

```css
@theme inline {
  --color-*: initial;
  --color-bg: var(--civitas-bg);
  --color-surface: var(--civitas-surface);
  --color-surface-raised: var(--civitas-surface-raised);
  --color-border: var(--civitas-border);
  --color-border-strong: var(--civitas-border-strong);
  --color-text: var(--civitas-text);
  --color-body: var(--civitas-body);
  --color-muted: var(--civitas-muted);
  --color-primary: var(--civitas-primary);
  --color-primary-strong: var(--civitas-primary-strong);
  --color-success: var(--civitas-success);
  --color-warning: var(--civitas-warning);
  --color-danger: var(--civitas-danger);
  --radius-card: var(--civitas-radius-lg);
  --radius-control: var(--civitas-radius-md);
  --spacing-sidebar: var(--civitas-sidebar-width);
}
```

Reglas:

- `theme.css` conserva los valores light/dark;
- el bridge no contiene hex, rgb o hsl;
- no se crea una familia `brand` competidora: la familia canónica es `primary`;
- la paleta default de Tailwind no gobierna identidad visual;
- una nueva utility semántica exige primero un token Civitas aprobado;
- se usa `@import "tailwindcss"` según el contrato v4;
- Vite debe usar una sola integración Tailwind; para #113 la integración vigente y soportada es `@tailwindcss/postcss`. La migración a `@tailwindcss/vite` queda fuera del cierre de #113 y requiere issue/PR separado con prueba de paridad antes de retirar PostCSS.

Referencias oficiales:

- https://tailwindcss.com/docs/upgrade-guide
- https://tailwindcss.com/docs/installation/using-vite

### 12.3 Frontera con #111

```text
#111: Screen/Action/Route/Nav eligibility
#112: token/primitive visual representation
```

AppShell puede consumir ambos resultados, pero no define permisos, topología, labels canónicos, colores, spacing o componentes de negocio.

El bloque Sidebar Layout de Tailwind Plus puede servir como referencia visual. No reemplaza la máquina de estados, rutas, responsive o Navigation Registry de AppShell/NavCollapse; el collapsed rail desktop queda fuera de Phase 2.

### 12.4 Capa React reusable

El único entrypoint reusable es:

```text
frontend/src/shared/ui/index.ts
```

Estado de primitives prioritarias:

| Necesidad | Decisión |
|---|---|
| Sidebar | Extender `NavCollapse` y layout existente; no crear otro Sidebar |
| Tables | Extender `DataTable` |
| Tabs | Crear `Tabs` con API controlada y keyboard model |
| Badges | Extender `StatusPill` antes de crear `Badge` |
| Toggles | Crear `Toggle` solo con consumidor real |
| Empty states | Reusar `EmptyState` / `StateRegion` |
| Description lists | Añadir solo al migrar detail/profile |
| Command palette | Fuera de Phase 2 |

Una feature no copia markup de un bloque externo si la necesidad ya está cubierta por `shared/ui`. Governance debe migrar sus tabs, matriz, badges y estados unavailable a primitives compartidas.

### 12.5 Intake de Tailwind Plus

El repositorio es público. La licencia de Tailwind Plus permite usar componentes en una aplicación open source que sea un producto final, pero prohíbe publicar una colección o UI library derivada separada.

Referencia: https://tailwindcss.com/plus/license

Por tanto:

```text
frontend/.design-intake/   local y gitignored
shared/ui/                 implementación Civitas promovida
docs/design-system/provenance.json   metadata, nunca source licenciado
```

No se versiona `_intake/` dentro de `src`.

Pipeline:

```text
licencia verificada
→ snippet local
→ mapper semántico
→ unresolved report = 0
→ revisión ARIA/keyboard/responsive
→ extender/crear primitive en shared/ui
→ agregar consumidor real y tests
→ borrar intake local
```

El mapper trabaja con clases completas y contexto. No reemplaza solo `gray-500` o `indigo-600` sin distinguir background, text, border, focus, hover y dark mode.

Toda implementación derivada registra provenance y queda limitada al producto Civitas. No puede trasladarse a un paquete público redistribuible sin revisión de licencia.

### 12.6 Enforcement

CI debe validar:

1. ninguna paleta Tailwind raw en producción;
2. ningún color/radius/shadow/z-index hardcodeado fuera de tokens/theme;
3. ningún import desde intake;
4. ninguna segunda raíz de UI kit;
5. cada utility semántica resuelve a un bridge token;
6. cada bridge token resuelve a un `--civitas-*`;
7. cada token nuevo tiene consumidor y documentación;
8. aliases deprecated no ganan consumidores;
9. build visual, light/dark y responsive permanecen operables.

Los validadores deben parsear clases/AST/CSS cuando corresponda; un grep global no es suficiente para clases dinámicas ni para distinguir valores de layout legítimos.

La deuda existente usa una allowlist finita con owner, motivo y fecha de eliminación. No se aceptan excepciones permanentes sin responsable.

### 12.7 Matriz mínima de QA

- owner y tenant;
- light y dark;
- desktop, tablet y mobile;
- sidebar expanded y drawer mobile;
- keyboard y focus-visible;
- reduced motion;
- empty, loading, error y planned;
- labels largos, overflow y zoom;
- deep links y refresh cuando interviene navegación.

### 12.8 Secuencia de implementación

La secuencia gobernable de #112 es:

```text
#117 P0
  ↓
#113 semantic bridge + #115 Stage A en paralelo
  ↓
#114 intake/provenance
  ↓
#116 primitives y migraciones
  ↓
#115 Stage B enforcement/QA
```

Condiciones de promoción:

- #114 no puede promover bloques: solo prepara intake local, mapper, reporte y provenance. Cualquier promoción real requiere licencia verificada, revisión humana y un consumidor de producto.
- #116 no puede migrar producto antes de que existan el bridge semántico de #113 y los gates mínimos de #115 Stage A.
- #111 valida la integración estructural de AppShell, Router, Breadcrumbs, rutas, topología y datos resueltos; #112 no absorbe ese ownership.

Nuevas pantallas Phase 2 no deben convertirse en patrón hasta que #111 y #112 estén cerrados.


### 12.9 Correcciones P0 y secuencia de gates

La validación ejecutable confirmó que el estado anterior era un falso verde: con las directivas v3, el build terminaba correctamente y el validator visual pasaba, pero el CSS emitido omitía utilities usadas como `.text-sm`, `.gap-2` y `.mt-3`.

#117 corrigió de forma aislada:

- entrada v4 mediante `@import "tailwindcss"`;
- workflow de `master` a `main`;
- verificación de utilities estructurales, tipográficas y de spacing en CSS emitido.

Secuencia corregida:

```text
#117 P0
   ↓
#113 bridge + #115 Stage A minimum gates (parallel)
   ↓
#114 intake
   ↓
#116 shared/ui migrations
   ↓
#115 Stage B full enforcement
   ↓
#111 final AppShell integration
```

Stage A debe bloquear desde el primer commit:

- paleta raw nueva;
- imports desde intake;
- segunda raíz de UI kit;
- desaparición de utilities representativas del CSS compilado.

#### Ownership de AppShell

- #111 es dueño de la estructura de navegación, rutas, required/fallback behavior y fallo ante navegación ausente.
- #116 es dueño de la presentación, tokens y adapters hacia `shared/ui/NavCollapse`.
- #116 no cambia topología/autorización.
- #111 no introduce estilos locales ni otro Sidebar.
- La integración se realiza en un único PR o en orden #111 estructural → #116 visual.

### 12.10 Bridge semántico Tailwind v4 de #113

#113 introduce un único bridge CSS-first en `frontend/src/styles/tailwind-theme.css`. El archivo usa exclusivamente `@theme inline` para mapear namespaces Tailwind a variables canónicas `--civitas-*`; no contiene valores `hex`, `rgb()`, `hsl()` u `oklch()`, ni duplica variantes light/dark. La resolución cromática sigue siendo responsabilidad de `frontend/src/styles/theme.css` mediante `:root[data-theme="light"]` y `:root[data-theme="dark"]`.

Ownership por capa:

- `frontend/src/styles/tokens.css`: escala canónica de spacing, typography, radius y geometría estructural.
- `frontend/src/styles/theme.css`: valores light/dark y aliases semánticos Civitas.
- `frontend/src/styles/tailwind-theme.css`: bridge contractual `--civitas-* → @theme inline → utilities Tailwind`.
- `frontend/src/styles/layout.css`, `frontend/src/styles/primitives.css` y `frontend/src/styles/dashboard.css`: primitives existentes y compatibilidad visual; no son una segunda librería.
- `frontend/src/shared/ui/`: único entrypoint reusable de componentes compartidos.
- `features/`: consumidores; no declaran paleta Tailwind raw ni imports desde `.design-intake`.

Namespaces Tailwind expuestos por el bridge de #113:

- color semántico: `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-surface-subtle`, `border-border`, `border-border-strong`, `text-text`, `text-body`, `text-muted`, `text-muted-strong`, `bg-primary`, `text-primary`, `text-primary-strong`, `text-primary-contrast`, estados `info`, `success`, `warning`, `danger`, `neutral`, `disabled` y `focus`;

- typography usada: `xs`, `sm`, `base`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`;
- radius usado: `sm`, `md`, `lg`, `xl`, `full`, `card` y `control`.

El namespace default de colores de Tailwind queda desactivado con `--color-*: initial` dentro del bridge. No se desactiva globalmente `--spacing-*` porque el inventario debe mantener compatibilidad con consumidores legítimos mientras se migra de forma segura; las claves usadas se conectan explícitamente a la escala Civitas.

Para añadir un mapping nuevo:

1. demostrar un consumidor real y su función semántica;
2. añadir primero o reutilizar el token `--civitas-*` en la capa dueña correspondiente;
3. mapear en `frontend/src/styles/tailwind-theme.css` solo con `var(--civitas-*)`;
4. añadir/mantener un sentinel si la utility protege una regresión relevante;
5. ejecutar `npm run build` y `npm run validate:tailwind-contract` desde `frontend`.

La migración de `@tailwindcss/postcss` a `@tailwindcss/vite` queda explícitamente fuera de #113 y no fue iniciada. #113 se valida sobre el pipeline existente `@tailwindcss/postcss`.

Stage A de #115 queda cubierto por `frontend/scripts/validate-tailwind-semantic-contract.mjs`, invocado por `npm run validate:tailwind-contract` y por el build frontend. Sus sentinels compilados mínimos son `.flex-wrap`, `.text-sm`, `.gap-2`, `.mt-3`, `.bg-surface`, `.text-muted` y `.border-border`. Este gate también bloquea directivas v3, otro `@theme` visual fuera del bridge aprobado, colores hardcodeados dentro del bridge, paleta Tailwind raw nombrada, valores arbitrarios de color, estilos inline con color hardcodeado, `frontend/src/design-system/` e imports de features desde `.design-intake`.

Relación con issues relacionados:

- #111 mantiene ownership de navegación, rutas y AppShell estructural; el bridge no cambia autorización ni topología.
- #112 define la dirección normativa del sistema visual; #113 materializa únicamente el bridge Tailwind semántico.
- #115 Stage A se activa aquí como gate mínimo; Stage B de duplicación visual queda fuera de este cambio.
- #116 sigue siendo el lugar para endurecer `shared/ui` y migraciones profundas de primitives/componentes; #113 no rediseña `civitas-card`, `civitas-topbar`, `civitas-primary-nav`, `NavCollapse`, `DataTable`, `StatusPill`, `EmptyState`, `SectionCard` ni `PageHeader`.

### 12.11 Intake licenciado Tailwind Plus y provenance de #114

El repositorio `lssmanager/civitas10` es público. Tailwind Plus solo puede intervenir cuando el titular autorizado de la licencia suministra localmente un bloque para ser adaptado dentro del producto final Civitas; no se accede, descarga, scrapea ni reconstruye código de Tailwind Plus desde este repositorio. La frontera normativa se mantiene enlazada a la licencia oficial de Tailwind Plus: https://tailwindcss.com/plus/license.

El intake autorizado para #114 es local, gitignored y nunca importable:

```text
frontend/.design-intake/                  # local, no versionado
frontend/scripts/design-system/           # scripts versionados
frontend/scripts/design-system/fixtures/  # fixtures sintéticos, no licenciados
docs/design-system/provenance.json        # metadata, no source
frontend/src/shared/ui/index.ts           # único entrypoint reusable
```

El pipeline permitido es:

```text
snippet local licenciado en frontend/.design-intake/
        ↓
map-tailwind-plus-palette.mjs con semantic-utility-map.json
        ↓
reporte JSON local con mapped / unchanged / unresolved / forbidden / requiresHumanReview
        ↓
revisión humana de semántica, accesibilidad, keyboard y responsive
        ↓
#116 decide si extiende o crea primitive en shared/ui con consumidor real
        ↓
entrada provenance metadata, sin source licenciado
```

El mapper de #114 no promueve componentes automáticamente, no escribe en `src/`, no modifica `features/`, no crea `Tabs`, `Toggle`, `Badge`, `Sidebar` ni ningún componente productivo, y falla cerrado si existe una clase unresolved, forbidden o pendiente de revisión humana. El mapping es por utility completa y significado (`bg-indigo-600` → `bg-primary`, `hover:bg-indigo-700` → `hover:bg-primary-strong`), no por hue o número aislado. Utilities arbitrarias como `text-[rgb(...)]` y variantes dark ambiguas como `dark:bg-gray-900` quedan unresolved hasta una revisión explícita; nunca se genera `dark:bg-*` por reflejo si el token semántico ya resuelve light/dark mediante `theme.css`.

`docs/design-system/provenance.json` contiene solo metadata de componentes ya aprobados y promovidos. El archivo inicial vacío `{ "version": 1, "entries": [] }` es válido. Una entrada real debe afirmar `licenseVerified: true`, `sourceCommitted: false`, `redistributionBoundary: "civitas10-end-product"`, SHA completa de promoción y reviews semántica/accesibilidad/responsive completas. El validador prohíbe emails, license keys, facturas, URLs privadas y source code. No se debe crear una entrada ficticia solo para demostrar el schema.

Gates añadidos por #114:

- `npm run design:intake:check`: valida que `.design-intake/` esté ignorado, no haya intake tracked, no existan imports desde intake, no haya raíces paralelas de UI kit, no se declaren Catalyst/Tailwind Plus Elements y `shared/ui/index.ts` siga siendo el entrypoint reusable.
- `npm run design:provenance:check`: valida provenance vacío o entradas reales sin secretos/source y con boundary correcto.
- `npm run design:intake:map`: CLI explícito para operar únicamente sobre archivos locales dentro de `frontend/.design-intake/`.

#114 complementa #115 Stage A con barreras de intake/provenance. #116 sigue siendo el único issue autorizado para construir primitives reales con consumidores reales, tests y una entrada provenance de promoción. Se prohíbe extraer componentes derivados de Tailwind Plus a un paquete público reusable, colección de snippets, `packages/design-system`, `tailwind-plus-components` o cualquier segunda librería visual.

### 12.12 Estado gobernable del epic #112 — verificación local 2026-07-13

Esta tabla documenta el estado verificable en la rama local de PR #102 usada para preparar la actualización del epic. No sustituye la edición del body de GitHub; si no hay permisos de API, debe copiarse como comentario/actualización de #112.

| Workstream | Estado verificable | Evidencia local | Bloqueo / próxima acción |
|---|---|---|---|
| #117 P0 | Completed en GitHub; presente en la rama | commits `6f546fc` y `6f3ab57`; `frontend/src/index.css` usa `@import "tailwindcss"`; `validate-civitas-visual` valida `.text-sm`, `.gap-2`, `.mt-3`, `.flex-wrap` | Cerrar solo si los workflows residuales del repo apuntan a `main`; los workflows de seguridad heredados que sigan en `master` deben corregirse o documentarse fuera del P0. |
| #113 bridge semántico | In progress en PR #102 local; issue GitHub sigue open | `frontend/src/styles/tailwind-theme.css`; `npm run validate:tailwind-contract`; build ejecuta el gate | Requiere merge/validación de PR #102 y cierre explícito de #113. |
| #115 Stage A | In progress en PR #102 local | `frontend/scripts/validate-tailwind-semantic-contract.mjs` bloquea directivas v3, bridge inválido, paleta raw, arbitrary colors, inline hardcoded colors e imports de `.design-intake`; build lo invoca | Debe corregirse cualquier falso positivo que impida `npm run build` y conectarse al workflow que corre contra `main`. |
| #114 intake/provenance | In progress en PR #102 local | `.design-intake/` gitignored; `map-tailwind-plus-palette.mjs`; `semantic-utility-map.json`; `docs/design-system/provenance.json`; `design:intake:check`; `design:provenance:check` | No promueve componentes. Debe mantener validadores sin bloquear sus propios scripts versionados. |
| #116 shared/ui migrations | Not started en esta rama local | No existe `frontend/src/shared/ui/Tabs.tsx`; `DataTable`, `EmptyState`, `StatusPill` mantienen APIs mínimas; Governance aún no consume `Tabs` | Siguiente workstream después de #113 + #115 Stage A + #114. |
| #115 Stage B | Not started en esta rama local | No existen `visual:check`, `validate-token-graph.mjs`, `validate-ui-import-boundaries.mjs`, `validate-responsive-a11y.mjs`, baseline finita ni matriz QA dedicada | Ejecutar después de #116; no declarar cierre del epic antes de este gate. |

#### Body recomendado para actualizar #112

#112 debe permanecer **abierto** hasta que los hijos #113, #114, #115 y #116 estén cerrados o resueltos con evidencia en la rama que se mergeará a `main`. El body del epic debe incluir:

- estado real por workstream con fecha y evidencia;
- orden corregido `#117 → #113 + #115 Stage A → #114 → #116 → #115 Stage B`;
- contrato AppShell: #111 posee rutas/topología/fallback/datos resueltos; #116 posee primitives visuales/tokens/presentación; authorization registry posee elegibilidad; `shared/ui/NavCollapse` posee interacción de sidebar;
- criterios de cierre ligados a comandos: `npm run build`, `npm run lint`, `npm run validate:tailwind-contract`, `npm run design:intake:check`, `npm run design:provenance:check` y, cuando exista Stage B, `npm run visual:check`;
- sección “No hacer”: no `frontend/src/design-system/`, no `packages/design-system/`, no tokens light/dark duplicados, no intake versionado, no Catalyst/Tailwind Plus sin revisión y no UI feature-local duplicada cuando exista primitive en `shared/ui`.

### 13. #111 Navigation topology contract

#111 owns the structural navigation chain and remains separate from the visual-system ownership of #112/#116. The executable chain is:

```text
permission catalog / backend operation contract
→ Authorization Context
→ Screen / Action Registry
→ Navigation Topology
→ route builders
→ Router + Sidebar + Breadcrumbs + AppShell
```

Contract files and ownership:

- `frontend/src/navigation/routes.ts` declares the canonical owner and tenant navigation trees. Owner navigation contract v2 makes `Governance` a main Phase 2 surface, consolidates runtime into direct `Operations`, keeps `Directory` / `Create` under `Organizations`, hides empty `Settings` children and hides `Profile` until a functional account surface exists.
- `frontend/src/navigation/route-builders.ts` is the only frontend builder for parameterized route patterns. It rejects missing, empty, or literal placeholder params so `%3AorganizationId` cannot be produced by navigation code.
- `frontend/src/layouts/AppShell.tsx` receives already-resolved navigation and exposes an explicit `navigation-required-but-empty` failure state instead of silently falling back to `emptyNavItems`.
- `frontend/src/layouts/OwnerLayout.tsx` and `frontend/src/layouts/OrganizationLayout.tsx` materialize the canonical owner/tenant trees for the shell; they do not define an alternate topology.
- `frontend/src/features/governance/governance-capabilities.ts` records unavailable Governance backend operations. Governance pages must render planned/unavailable states and must not fetch an aggregate or preview endpoint until the operation registry marks it active.

Enforcement:

- `npm run validate:navigation-contract` blocks `frontend/src/platform/**`, raw `:organizationId` placeholders outside route contracts/tests, `navigate`/`Link`/`fetch` usage with literal route params, `%3AorganizationId`, missing owner/tenant trees, and silent AppShell empty navigation fallback.
- `npm run build` runs the navigation contract after the visual and intake validators.
- Human protection is represented in `.github/CODEOWNERS` for navigation, authorization, AppShell, Router entrypoint, and the navigation validator. Repository rulesets / required review must still be enabled in GitHub settings if not already active; the repo file alone cannot force branch protection.

Governance matrix for the current branch:

| Surface | Screen | Action | Permission | Backend operation | Effective state |
|---|---|---|---|---|---|
| Owner | `owner-organization-governance` | `governance.access.preview` | `governance.owner.read` + `governance.preview.read` | `governance.readModel` / `governance.accessPreview` | `unavailable` until handlers are mounted |
| Tenant | `tenant-governance` | `governance.access.preview` | `governance.tenant.read` + `governance.preview.read` | `governance.readModel` / `governance.accessPreview` | `unavailable` until handlers are mounted |

This status means #111 is prepared for closure only after PR #102 is updated with these contracts, CI is green against `main`, and the GitHub-side required-review/ruleset status is verified.


## Navigation product validation update — owner contract v2

Product visual validation superseded the earlier #111 hierarchy. Governance is not a global owner page: it is contextual to a selected organization. The frozen Phase 2 owner sidebar topology is now: `Overview`, `Operations`, `Organizations → Directory/Create`, optional `Settings` only when it has active destinations, and optional `Profile` only when it renders a functional surface.

Governance is reached from Organization Directory by selecting a real organization and opening `/owner/organizations/:organizationId/governance` from the organization detail tabs. `/owner/governance` is a selector/redirect guard, not a final product screen. Operations is a single direct dashboard entry; runtime status, worker queues and diagnostics belong inside that dashboard rather than as permanent sidebar children. Organization detail remains contextual and is not a static sidebar item.

Authorization Governance Studio is a product surface, not architecture documentation. Its shell is `OrganizationContextHeader → GovernanceSummary → shared/ui Tabs → tab panel`; tab IDs are stable (`overview`, `roles-permissions`, `taxonomy`, `groups`, `data-scopes`, `aliases-navigation`, `access-preview`, `audit-diagnostics`), and the UI must translate read-model codes into product language while keeping endpoint/write constraints in architecture docs, diagnostics, or tests rather than primary UI copy.

Desktop navigation uses a stable expanded sidebar during Phase 2. The desktop collapsed rail, rail tooltips, rail flyouts and persisted rail preference are removed. Mobile/tablet keeps the responsive drawer with accessible labels, Escape/backdrop close behavior and focus-visible navigation. Reintroducing a collapsed rail requires a new issue/decision record with usage evidence, validated design and CODEOWNER review.

Navigation contract changes require: version bump, canonical snapshot/test update, product justification, CODEOWNER review, desktop/mobile visual validation and migration notes for stable route changes. CI validates the executable contract, but GitHub branch protection/rulesets must still require human CODEOWNER review.
