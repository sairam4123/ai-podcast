import { useState, useRef, useEffect, KeyboardEvent, MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

type MenuOption = {
  label: string;
  value: string;
  onSelect?: () => void;
  disabled?: boolean;
  isDangerous?: boolean;
};

// const options: MenuOption[] = [
//   { label: "Profile", value: "profile" },
//   { label: "Settings", value: "settings" },
//   { label: "Logout", value: "logout" },
// ];

export default function MenuButton({
    // onSelect,
    options,
    children,
    }: {
    // onSelect?: (value: string) => void;
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
        setFocusedIndex((prev) =>
          prev <= 0 ? options.length - 1 : prev - 1
        );
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
      default:
        break;
    }
  };

  useEffect(() => {
    if (focusedIndex !== -1 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleSelect = (value: MenuOption) => {
    console.log("Selected:", value);
    setOpen(false);
    setFocusedIndex(-1);

    value.onSelect?.();

    // onSelect?.(value);
    // if (value === "logout") {
    //   alert("Logging out...");
    // }
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
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          id="dropdown-menu"
          role="menu"
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -10,
          }}
          transition={{ duration: 0.3 }}
          aria-label="Options"
          onKeyDown={handleKeyDown}
          className="absolute right-0 mt-2 w-44 bg-sky-900 rounded-md shadow-lg border border-sky-100 z-10"
        >
          <ul className="py-1">
            {options.map((opt, index) => (
              <li key={opt.value} role="none">
                <button
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-sky-800 focus:outline-none focus:bg-sky-700 ${
                    opt.isDangerous ? "text-red-600 hover:bg-red-100" : opt.disabled ? "text-gray-600/40" : ""
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
