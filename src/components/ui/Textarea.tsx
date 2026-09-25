/**
 * Textarea component
 *
 * Props:
 *   - id: string — required for label association and accessibility
 *   - label?: string — visible label rendered above the textarea
 *   - placeholder?: string
 *   - value?: string
 *   - onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
 *   - error?: string — validation error message shown below the textarea
 *   - disabled?: boolean
 *   - required?: boolean
 *   - rows?: number (default: 4)
 *   - className?: string — optional extra Tailwind classes on the wrapper
 */
import React from "react";

type TextareaProps = {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
};

export default function Textarea({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = "",
}: TextareaProps) {
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
      <textarea
        id={id}
        rows={rows}
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
          transition-colors duration-150 resize-y
          ${error ? "border-error focus:ring-error" : ""}
        `.trim()}
      />
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
