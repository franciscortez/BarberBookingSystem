import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  help?: string;
  error?: string;
}
const FormField = ({
  label,
  id,
  help,
  error,
  ...inputProps
}: FormFieldProps) => (
  <div className="task-field">
    <label htmlFor={id}>{label}</label>
    <input
      {...inputProps}
      id={id}
      className="task-input"
      aria-invalid={error ? true : undefined}
      aria-describedby={
        [help ? id + "-help" : "", error ? id + "-error" : ""]
          .filter(Boolean)
          .join(" ") || undefined
      }
    />
    {help && <small id={id + "-help"}>{help}</small>}
    {error && (
      <small id={id + "-error"} className="task-field-error">
        {error}
      </small>
    )}
  </div>
);
export default FormField;
