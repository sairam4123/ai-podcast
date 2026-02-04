import { cn } from "../lib/cn";
import Spinner from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-slate-200 to-slate-200 hover:from-white hover:to-slate-100 text-slate-900 shadow-sm border border-slate-300/50",
  secondary:
    "bg-surface hover:bg-surface-highlight text-tertiary-foreground border border-tertiary/20",
  ghost:
    "bg-transparent hover:bg-surface-highlight text-tertiary hover:text-primary",
  danger:
    "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20",
};

export default function Button({
  onClick,
  isLoading = false,
  className = "",
  children,
  type = "button",
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={(e) => {
        if (!disabled && !isLoading) {
          onClick?.(e);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variantStyles[variant],
        className
      )}
    >
      {isLoading && <Spinner size="sm" color={variant === 'primary' ? 'gray' : 'primary'} />}
      {children}
    </button>
  );
}