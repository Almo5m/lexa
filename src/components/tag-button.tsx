"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface TagButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  quiet?: boolean;
  gradient?: boolean;
  children: ReactNode;
}

export function Dots({ label }: { label?: string }) {
  return (
    <span className="dots" role="status">
      <span />
      <span />
      <span />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function TagButton({
  loading = false,
  quiet = false,
  gradient = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: TagButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`tag-btn ${quiet ? "tag-btn-quiet" : ""} ${gradient ? "tag-btn-grad" : ""} ${className}`}
      {...props}
    >
      {loading ? <Dots /> : children}
    </button>
  );
}
