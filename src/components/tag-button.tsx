"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface TagButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  quiet?: boolean;
  children: ReactNode;
}

export function ScrambleText({ text }: { text: string }) {
  return (
    <span aria-hidden="true">
      {[...text].map((char, index) => (
        <span
          key={index}
          className="scramble-letter"
          style={{ animationDelay: `${(index % 5) * 90}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export function TagButton({
  loading = false,
  quiet = false,
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
      data-loading={loading}
      className={`tag-btn ${quiet ? "tag-btn-quiet" : ""} ${className}`}
      {...props}
    >
      <span className="tag-btn-label">{children}</span>
    </button>
  );
}
