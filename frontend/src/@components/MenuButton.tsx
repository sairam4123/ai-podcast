import { useState, useRef, useEffect, KeyboardEvent, MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

type MenuOption = {
  label: string;
  value: string;
  onSelect?: () => void;
  disabled?: boolean;
  isDangerous?: boolean;
};

export default function MenuButton({
  options,
  children,
}: {
  options: MenuOption[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
        break;
      case "Escape":
        setOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case "Enter":
      case " ":
        if (focusedIndex !== -1) {
          e.preventDefault();
          handleSelect(options[focusedIndex]);
        }
        break;
    }
  };

  useEffect(() => {
    if (focusedIndex !== -1 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleSelect = (value: MenuOption) => {
    setOpen(false);
    setFocusedIndex(-1);
    value.onSelect?.();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          setOpen((prev) => !prev);
          setFocusedIndex(0);
        }}
        aria-haspopup="true"
        tabIndex={0}
        aria-expanded={open}
        aria-controls="dropdown-menu"
        className="bg-transparent hover:bg-white/5 text-white px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      >
        {children}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="dropdown-menu"
            role="menu"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            aria-label="Options"
            onKeyDown={handleKeyDown}
            className="absolute right-0 mt-2 w-44 bg-cyan-950/95 backdrop-blur-md rounded-xl shadow-xl border border-cyan-500/20 z-50 overflow-hidden"
          >
            <ul className="py-1">
              {options.map((opt, index) => (
                <li key={opt.value} role="none">
                  <button
                    ref={(el) => { itemRefs.current[index] = el; }}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => handleSelect(opt)}
                    disabled={opt.disabled}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors focus:outline-none ${opt.isDangerous
                      ? "text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                      : opt.disabled
                        ? "text-cyan-700 cursor-not-allowed"
                        : "text-cyan-100 hover:bg-cyan-800/50 focus:bg-cyan-800/50"
                      }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
