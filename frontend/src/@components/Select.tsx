import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { cn } from "../lib/cn";

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function Select({ options, value, onChange, className, placeholder = "Select..." }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full gap-2 px-3 py-2 text-sm font-medium text-tertiary-foreground transition-all border rounded-lg bg-surface border-tertiary/20 hover:bg-surface-highlight focus:outline-none focus:border-primary/50"
            >
                <span className={cn("truncate", !selectedOption && "text-tertiary")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <FaChevronDown
                    className={cn("w-3 h-3 text-tertiary transition-transform duration-200", isOpen && "rotate-180")}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 w-full min-w-[140px] mt-2 overflow-hidden bg-surface border border-tertiary/20 rounded-lg shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "flex items-center w-full px-3 py-2 text-sm text-left transition-colors",
                                    option.value === value
                                        ? "bg-primary/10 text-primary"
                                        : "text-tertiary hover:bg-surface-highlight hover:text-tertiary-foreground"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
