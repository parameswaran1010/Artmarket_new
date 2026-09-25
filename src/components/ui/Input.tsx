/**
 * Input component
 *
 * Props:
 *   - id: string — required for label association and accessibility
 *   - label?: string — visible label rendered above the input
 *   - type?: string — HTML input type (default: "text")
 *   - placeholder?: string
 *   - value?: string
 *   - onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
 *   - error?: string — validation error message shown below the input
 *   - disabled?: boolean
 *   - required?: boolean
 *   - className?: string — optional extra Tailwind classes on the wrapper
 */
import React from "react";

type InputProps = {
  id: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
};

export default function Input({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = "",
  inputClassName = "",
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary"
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          w-full rounded border px-3 py-2 text-sm
          bg-surface text-text-primary placeholder:text-text-secondary
          border-border
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          ${error ? "border-error focus:ring-error" : ""}
          ${inputClassName}
        `.trim()}
      />
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
