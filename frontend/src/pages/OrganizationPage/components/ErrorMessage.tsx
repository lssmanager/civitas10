import { AlertStrip } from "../../../shared/ui";

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <section className="civitas-card" data-organization-error-state="true">
      <AlertStrip variant="danger" title="Could not load organization workspace">
        {message}
      </AlertStrip>
    </section>
  );
};
