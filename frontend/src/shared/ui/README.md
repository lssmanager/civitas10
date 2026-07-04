# Civitas shared UI primitives

## FormField

Wraps one existing form control with a Civitas label, optional required marker, hint, and error text. Keep the input/select/textarea logic in the calling page and apply the existing `civitas-field` class to the control.

## AlertStrip

React wrapper for the `civitas-alert` visual primitive. Use `variant="danger"` for blocking user-facing errors and keep technical diagnostics in logs rather than visible DOM copy.

## Stepper

Displays the current wizard step with completed, active, and pending states. Pass stable step ids and a zero-based `activeStep` from the parent wizard state.
