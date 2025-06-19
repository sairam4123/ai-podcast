
import { cn } from "../lib/cn";
import Spinner from "./Spinner";

export default function Button({
    onClick,
    isLoading = false,
    className = "",
    children,
    type = "button",
}: {
    onClick?: ((e: React.MouseEvent<HTMLButtonElement>) => void) | (() => void);
    isLoading?: boolean;
    className?: string;
    children?: React.ReactNode;
    type?: "button" | "submit" | "reset";
}) {
    return <button
      type={type}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      }}
      className={cn("bg-blue-500 flex items-center text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors cursor-pointer", className)}
    >
      <Spinner isLoading={isLoading} />
      {children}
    </button>
}