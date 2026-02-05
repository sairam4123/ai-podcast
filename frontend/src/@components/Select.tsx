import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
    usePortal?: boolean;
}

export function Select({ options, value, onChange, className, placeholder = "Select...", usePortal = false }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const [search, setSearch] = useState("");

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8, // Fixed position relative to viewport
                left: rect.left,
                width: rect.width
            });
        } else {
            setPosition(null);
            setSearch(""); // Reset search when closed
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInsideContainer = containerRef.current?.contains(target);
            const clickedInsideDropdown = dropdownRef.current?.contains(target);

            if (!clickedInsideContainer && !clickedInsideDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        const handleResize = () => setIsOpen(false); // Close on resize to avoid position issues
        window.addEventListener("resize", handleResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("resize", handleResize);
        }
    }, []);

    const dropdownContent = (
        <div
            ref={dropdownRef}
            style={usePortal && position ? {
                position: "fixed",
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 9999
            } : undefined}
            className={cn(
                "min-w-[140px] overflow-hidden bg-surface border border-tertiary/20 rounded-lg shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 origin-top-right",
                usePortal ? "" : "absolute right-0 z-50 w-full mt-2",
                // If using portal but no position yet, hide it (though logic below prevents render)
                usePortal && !position && "invisible"
            )}
        >
            <div className="p-2 border-b border-tertiary/10">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-2 py-1.5 text-sm bg-surface-highlight/50 rounded-md border-none outline-none focus:ring-1 focus:ring-primary/50 text-tertiary-foreground placeholder:text-tertiary/70"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                    autoFocus
                />
            </div>
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
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
                    ))
                ) : (
                    <div className="px-3 py-2 text-sm text-tertiary text-center">
                        No results found
                    </div>
                )}
            </div>
        </div>
    );

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
                usePortal
                    ? (position && createPortal(dropdownContent, document.body))
                    : dropdownContent
            )}
        </div>
    );
}
