import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export const TaskHeader = ({ pathname }: { pathname: string }) => {
  const { user, loading, logout } = useAuth();
  const isAuth = pathname === "/login" || pathname === "/signup";
  return (
    <header className="task-header">
      <div className="task-container task-header-inner">
        <Link to="/" className="task-brand">
          <img src="/favicon.svg" width="36" height="36" alt="" />
          <span>Gentlemen’s Quarters</span>
        </Link>
        <nav className="task-header-actions" aria-label="Account navigation">
          {isAuth ? (
            <Link to="/book" className="task-link">
              Book as guest
            </Link>
          ) : pathname === "/book" ? (
            loading ? (
              <span role="status">Loading account</span>
            ) : user ? (
              <>
                <span className="task-account-name">{user.name}</span>
                <button
                  type="button"
                  className="task-button secondary"
                  onClick={() => void logout()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <span className="task-muted">No account needed</span>
            )
          ) : (
            <Link to="/book" className="task-link">
              Book an appointment
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export const TaskFooter = () => (
  <footer className="task-footer">
    <div className="task-container task-footer-inner">
      <p>© {new Date().getFullYear()} Gentlemen’s Quarters</p>
      <Link className="task-link" to="/">
        Back to home
      </Link>
    </div>
  </footer>
);

export const TaskLoading = () => (
  <div className="task-state" role="status" aria-busy="true">
    <p>Loading this page</p>
    <div className="task-skeleton" aria-hidden="true" />
    <div className="task-skeleton" aria-hidden="true" />
  </div>
);
