import { Link } from "react-router-dom";

const ManagementState = ({
  token,
  loading,
  error,
  onRetry,
}: {
  token: string | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}) => {
  if (!token)
    return (
      <section className="task-state">
        <h1>Open your email link.</h1>
        <p className="task-muted">
          Use the cancellation or rescheduling link from your booking
          confirmation email.
        </p>
        <Link className="task-link" to="/">
          Back to home
        </Link>
      </section>
    );
  if (loading)
    return (
      <section className="task-state" aria-busy="true">
        <h1>Your appointment.</h1>
        <p role="status" className="task-muted">
          Loading your booking details
        </p>
        <div className="task-skeleton" aria-hidden="true" />
      </section>
    );
  return (
    <section className="task-state">
      <h1>We couldn’t open this booking.</h1>
      <p className="task-notice error" role="alert">
        {error || "Please use the link from your confirmation email."}
      </p>
      <div className="task-actions">
        {onRetry && (
          <button
            type="button"
            className="task-button secondary"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
        <Link className="task-link" to="/">
          Back to home
        </Link>
      </div>
    </section>
  );
};
export default ManagementState;
