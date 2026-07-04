# Civitas Wizard Pattern

The Create organization page is the reference implementation for future multi-step flows.

## Structure

A wizard must include:

1. `PageHeader` in the page layout.
2. `Stepper` with stable step ids and parent-controlled `activeStep`.
3. One component per step.
4. Each step wrapped in `SectionCard`.
5. Fields wrapped in `FormField`.
6. Related fields grouped with `civitas-form-grid`.
7. Errors and warnings rendered with `AlertStrip`.
8. Persistent bottom `ActionBar sticky` containing status on the left and Back / Next / Submit on the right.
9. Submit only on the final step; keep existing validation and submit logic in the parent.

## Create organization steps

- `StepCanonicalOrganization`
- `StepBusinessProfile`
- `StepAdminUsers`
- `StepSegmentation`
- `StepReview`

The flow must not regress to a single long megaform. Add new wizard fields inside the relevant step component and keep data state at page/wizard level.
