import React from "react";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  isLoading,
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-sm",
    secondary:
      "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-50"
  }[variant];

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
        variantClasses,
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

type CardProps = React.HTMLAttributes<HTMLDivElement>;
export const Card: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div
    className={cx(
      "bg-white border border-gray-100 rounded-xl p-6 shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;
export const Badge: React.FC<BadgeProps> = ({ className, children, ...props }) => (
  <span
    className={cx(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
      className
    )}
    {...props}
  >
    {children}
  </span>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input: React.FC<InputProps> = ({ className, ...props }) => (
  <input
    className={cx(
      "w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition",
      className
    )}
    {...props}
  />
);

