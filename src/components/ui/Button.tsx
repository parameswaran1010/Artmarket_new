/**
 * Button component
 *
 * Props:
 *   - children: ReactNode — button label
 *   - variant?: "primary" | "outline" | "ghost" — visual style (default: "primary")
 *   - size?: "sm" | "md" | "lg" — padding size (default: "md")
 *   - disabled?: boolean
 *   - type?: "button" | "submit" | "reset"
 *   - onClick?: () => void
 *   - className?: string — optional extra Tailwind classes
 */
import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger" | "danger-outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
  title?: string;
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const variantClasses = {
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:opacity-50",
  outline:
    "border border-accent text-accent hover:bg-accent hover:text-white disabled:opacity-50",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-border disabled:opacity-50",
  danger:
    "bg-error text-white hover:bg-red-700 disabled:opacity-50",
  "danger-outline":
    "border border-error text-error hover:bg-error hover:text-white disabled:opacity-50",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className = "",
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`
        inline-flex items-center justify-center rounded
        font-medium transition-colors duration-150 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? "cursor-not-allowed" : ""}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
}
