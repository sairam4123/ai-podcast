import { useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { cn } from "../lib/cn";

const variants = {
    'md': 'max-w-md w-full',
    'lg': 'max-w-lg w-full',
    'xl': 'max-w-xl w-full',
}

export function SearchBox({
    searchTerm,
    setSearchTerm,
    variant = 'md'
}: {
    searchTerm?: string;
    setSearchTerm: (term: string) => void;
    variant?: keyof typeof variants;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return <div className={cn("flex transition-all items-center group drop-shadow-md hover:scale-[1.02] drop-shadow-gray-500 hover:drop-shadow-lg hover:drop-shadow-black/50 focus-within:drop-shadow-gray-300 justify-center bg-white cursor-text rounded-xl w-9/12 lg:w-1/2 xl:w-6/7 p-3 space-x-2", variants[variant])} onClick={() => {
        inputRef.current?.focus();
    }}>
        <FaSearch className="group-focus-within:text-gray-800 flex text-gray-500" />
        <input type="text" ref={inputRef} placeholder="What's in your mind?"
            onChange={(e) => {setSearchTerm(e.target.value)}}
             value={searchTerm} className="flex grow selection:bg-black/25 ring-0 outline-none focus:placeholder:text-black/70 text-black placeholder:text-black/50" />
    </div>
}