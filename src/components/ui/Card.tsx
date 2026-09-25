/**
 * Card component
 *
 * Props:
 *   - children: ReactNode — card content
 *   - className?: string — optional extra Tailwind classes
 *   - onClick?: () => void — makes the card clickable (adds cursor-pointer)
 *   - padding?: "none" | "sm" | "md" | "lg" — internal padding (default: "md")
 */
import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClasses = {
  none: "",
  sm:   "p-3",
  md:   "p-5",
  lg:   "p-7",
};

export default function Card({
  children,
  className = "",
  onClick,
  padding = "md",
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface border border-border rounded-lg
        ${paddingClasses[padding]}
        ${onClick ? "cursor-pointer hover:border-accent transition-colors duration-150" : ""}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
