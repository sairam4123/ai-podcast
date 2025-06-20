import { useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { cn } from "../lib/cn";

import { AnimatePresence, motion } from "framer-motion";

const variants = {
    'md': 'max-w-md w-full',
    'lg': 'max-w-lg w-full',
    'xl': 'max-w-xl w-full',
}

export function SearchBox({
    searchTerm,
    // setSearchTerm,
    variant = 'md'
}: {
    searchTerm?: string;
    setSearchTerm?: (term: string) => void;
    variant?: keyof typeof variants;
}) {
    const [intialSearchTerm, setInitialSearchTerm] = useState(searchTerm || '');
    const inputRef = useRef<HTMLInputElement>(null);

    return <div className={cn("flex transition-all relative items-center group drop-shadow-md hover:scale-[1.02] drop-shadow-gray-500 hover:drop-shadow-lg hover:drop-shadow-black/50 focus-within:drop-shadow-gray-300 justify-center bg-white cursor-text rounded-xl w-9/12 lg:w-1/2 xl:w-6/7 p-3 space-x-2 z-10", variants[variant])} onClick={() => {
        inputRef.current?.focus();
    }}>
        <FaSearch className="group-focus-within:text-gray-800 flex z-10 text-gray-500" />
        <input type="text" ref={inputRef} placeholder="What's in your mind?"
            onChange={(e) => {setInitialSearchTerm(e.target.value)}}
             value={intialSearchTerm} className="flex grow z-10 selection:bg-black/25 ring-0 outline-none focus:placeholder:text-black/70 text-black placeholder:text-black/50" />
        
        <div className="hidden group-focus-within:block z-10 inset-0">
            <AnimatePresence>
            {intialSearchTerm &&
                <motion.div 

                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: -10 }}
                exit={{ opacity: 0, y: -10 }}


                className="absolute translate-y-14 h-48 rounded-lg z-10 inset-0 bg-white">

                <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm">Search results will appear here...</p>
            </div>
            </motion.div>}
            </AnimatePresence>
        </div>
    </div>
}