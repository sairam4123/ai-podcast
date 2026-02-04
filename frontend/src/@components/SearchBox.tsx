import { useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { cn } from "../lib/cn";
import useDebounce from "../hooks/useDebounce";
import { AnimatePresence, motion } from "framer-motion";
import { SearchPodcastCard } from "./SearchPodcastCard";
import { api } from "../api/api";

const variants = {
  md: "max-w-md w-full",
  lg: "max-w-lg w-full",
  xl: "max-w-xl w-full",
};

export function SearchBox({
  searchTerm,
  contentClassName,
  variant = "md",
}: {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  contentClassName?: string;
  onClose?: () => void;
  variant?: keyof typeof variants;
}) {
  const [intialSearchTerm, setInitialSearchTerm] = useState(searchTerm || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [debouncedSearchTerm] = useDebounce(intialSearchTerm, 500);

  const { data, isLoading, error } = api.useSearchPodcast({
    searchTerm: debouncedSearchTerm,
  });

  return (
    <div
      className={cn(
        "flex transition-all relative items-center group bg-cyan-950/60 backdrop-blur-sm border border-cyan-500/20 cursor-text rounded-xl w-9/12 lg:w-1/2 xl:w-6/7 p-3 space-x-2 hover:border-cyan-400/40 focus-within:border-cyan-400/50 z-40",
        variants[variant]
      )}
      onClick={(e) => {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSearchResults(true);
      }}
    >
      <FaSearch className="text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors flex-shrink-0" />
      <input
        type="text"
        ref={inputRef}
        placeholder="What's in your mind?"
        onChange={(e) => {
          setInitialSearchTerm(e.target.value);
          setShowSearchResults(true);
        }}
        onFocus={() => setShowSearchResults(true)}
        onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
        value={intialSearchTerm}
        className="flex grow bg-transparent ring-0 outline-none text-white placeholder:text-cyan-600/60 selection:bg-cyan-500/30"
      />

      <AnimatePresence>
        {intialSearchTerm && showSearchResults && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: -10 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              `absolute top-full left-0 right-0 mt-2 max-h-80 rounded-xl overflow-hidden z-[100] bg-cyan-950 backdrop-blur-md border border-cyan-500/20 shadow-2xl shadow-black/50`,
              contentClassName
            )}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-32">
                <FaSearch className="animate-spin text-2xl text-cyan-500/50" />
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-32 text-red-400">
                <p className="text-center px-4 text-sm">Error searching podcasts.</p>
              </div>
            )}
            <div className="flex flex-col overflow-auto max-h-80">
              {!isLoading && data?.results.length === 0 && (
                <div className="flex items-center justify-center h-32 text-cyan-500/60">
                  <p className="text-center px-4">No podcasts found for "{intialSearchTerm}"</p>
                </div>
              )}
              {!isLoading && data?.results.slice(0, 20).map((podcast) => (
                <SearchPodcastCard key={podcast.id} podcast={podcast} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
