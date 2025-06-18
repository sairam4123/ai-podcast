import { PiSpinnerGap } from "react-icons/pi";
import { cn } from "../lib/cn";

export default function Spinner({
    isLoading = true,
    size = '1.25rem',
    className = '',
    marginRight = '0.5rem',
}: {
    isLoading?: boolean;
    size?: string;
    className?: string;
    marginRight?: string;
}) {
    return <div
        className={cn("transition-all duration-300 overflow-hidden", className)}
        style={{
          width: isLoading ? size : '0px', // 1.25rem = 20px
          height: isLoading ? size : '0px',
          marginRight: isLoading ? marginRight : '0px',
        }}
      >
        <PiSpinnerGap className="animate-spin text-xl" />
      </div>
    
}