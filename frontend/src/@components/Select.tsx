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
                className="flex items-center justify-between w-full gap-2 px-3 py-2 text-sm font-medium text-white transition-all border rounded-lg bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 focus:outline-none"
            >
                <span className={cn("truncate", !selectedOption && "text-slate-400")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <FaChevronDown
                    className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 w-full min-w-[140px] mt-2 overflow-hidden bg-[#0f1014] border border-white/10 rounded-lg shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="max-h-60 overflow-y-auto py-1">
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
                                        ? "bg-cyan-500/10 text-cyan-400"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
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
