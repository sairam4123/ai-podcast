import { cn } from "../lib/cn";
import Spinner from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost";

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
    "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20",
  secondary:
    "bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-100 border border-cyan-500/20",
  ghost:
    "bg-transparent hover:bg-cyan-900/30 text-cyan-200 hover:text-white",
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
      {isLoading && <Spinner size="sm" color={variant === 'primary' ? 'white' : 'cyan'} />}
      {children}
    </button>
  );
}