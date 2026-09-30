import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import type { useAuthForm } from "../../../hooks/useAuthForm";
import FormField from "../common/FormField";

const AuthSection = (form: ReturnType<typeof useAuthForm>) => {
  const registering = form.mode === "signup";
  return (
    <div className="task-container auth-layout">
      <figure className="auth-photo">
        <img
          src="/images/landing/interior-800.jpg"
          srcSet="/images/landing/interior-800.jpg 800w, /images/landing/interior-1600.jpg 1600w"
          sizes="(min-width: 1024px) 45vw, 1px"
          width="800"
          height="800"
          alt="An empty barber chair in a warmly lit interior."
        />
        <figcaption>Illustrative interior.</figcaption>
      </figure>
      <section className="auth-form-area" aria-labelledby="auth-title">
        <div className="task-intro">
          <h1 id="auth-title">
            {registering ? "Create your account." : "Welcome back."}
          </h1>
          <p>
            {registering
              ? "Save your contact details for your next booking."
              : "Sign in for saved contact details or your staff schedule."}
          </p>
        </div>
        <form
          className="task-form"
          onSubmit={form.submit}
          noValidate
          aria-busy={form.pending}
        >
          {registering && (
            <>
              <FormField
                id="auth-name"
                name="name"
                label="Full name"
                autoComplete="name"
                required
                maxLength={255}
                value={form.fields.name}
                error={form.errors.name}
                disabled={form.pending}
                onChange={(event) =>
                  form.changeField("name", event.target.value)
                }
              />
              <FormField
                id="auth-phone"
                name="phone"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                required
                maxLength={50}
                value={form.fields.phone}
                error={form.errors.phone}
                disabled={form.pending}
                onChange={(event) =>
                  form.changeField("phone", event.target.value)
                }
              />
            </>
          )}
          <FormField
            id="auth-identifier"
            name={registering ? "email" : "identifier"}
            label={registering ? "Email address" : "Email or username"}
            type={registering ? "email" : "text"}
            autoComplete={registering ? "email" : "username"}
            autoCapitalize="none"
            spellCheck={false}
            required
            value={form.fields.identifier}
            error={form.errors.identifier}
            disabled={form.pending}
            onChange={(event) =>
              form.changeField("identifier", event.target.value)
            }
          />
          <div className="task-field">
            <label htmlFor="auth-password">Password</label>
            <div className="task-password">
              <input
                className="task-input"
                id="auth-password"
                name="password"
                type={form.showPassword ? "text" : "password"}
                autoComplete={registering ? "new-password" : "current-password"}
                required
                minLength={registering ? 6 : undefined}
                value={form.fields.password}
                disabled={form.pending}
                aria-invalid={!!form.errors.password}
                aria-describedby={
                  form.errors.password
                    ? "auth-password-error"
                    : registering
                      ? "auth-password-help"
                      : undefined
                }
                onChange={(event) =>
                  form.changeField("password", event.target.value)
                }
              />
              <button
                type="button"
                aria-label={
                  form.showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={form.showPassword}
                disabled={form.pending}
                onClick={() => form.setShowPassword(!form.showPassword)}
              >
                {form.showPassword ? (
                  <EyeOff size={20} aria-hidden="true" />
                ) : (
                  <Eye size={20} aria-hidden="true" />
                )}
              </button>
            </div>
            {registering && (
              <small id="auth-password-help">Use at least 6 characters.</small>
            )}
            {form.errors.password && (
              <small id="auth-password-error" className="task-field-error">
                {form.errors.password}
              </small>
            )}
          </div>
          {form.error && (
            <p className="task-notice error" role="alert">
              {form.error}
            </p>
          )}
          <button
            className="task-button wide"
            type="submit"
            disabled={form.pending || form.accountLoading}
          >
            {form.pending
              ? registering
                ? "Creating your account"
                : "Signing in"
              : registering
                ? "Create account"
                : "Sign in"}
          </button>
          <span className="sr-only" role="status">
            {form.pending
              ? "Please wait. Your account request is processing."
              : form.accountLoading
                ? "Checking your account session."
                : ""}
          </span>
        </form>
        <p className="auth-switch">
          {registering ? "Already have an account? " : "New here? "}
          <Link
            className="task-link"
            to={registering ? "/login" : "/signup"}
            state={{ from: form.requested }}
          >
            {registering ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <p className="auth-guest">
          You can book without an account.{" "}
          <Link className="task-link" to="/book">
            Continue as a guest
          </Link>
        </p>
      </section>
    </div>
  );
};
export default AuthSection;
