import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { api } from "../api/api";
import PodcastCardSkeleton, { PodcastCard } from "../@components/PodcastCard";
import useDebounce from "../hooks/useDebounce";

export default function Search() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    const { data, isLoading, error } = api.useSearchPodcast({
        searchTerm: debouncedSearchTerm,
    });

    const hasResults = data?.results && data.results.length > 0;
    const showEmptyState = !isLoading && debouncedSearchTerm && !hasResults;

    return (
        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 py-6 space-y-8">
            {/* Search Header */}
            <div className="space-y-4">
                <h1 className="font-heading text-3xl font-bold text-white">Search</h1>

                {/* Search Input */}
                <div className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <FaSearch className="text-cyan-500/60" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="What do you want to listen to?"
                        className="w-full pl-12 pr-4 py-4 rounded-full bg-cyan-950/60 border border-cyan-500/20 text-white placeholder:text-cyan-600/60 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all text-lg"
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <PodcastCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {error && (
                <div className="text-center py-12">
                    <p className="text-red-400">Error searching podcasts: {error.message}</p>
                </div>
            )}

            {showEmptyState && (
                <div className="text-center py-16">
                    <FaSearch className="text-6xl text-cyan-500/30 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
                    <p className="text-cyan-400/60">
                        No podcasts found for "{debouncedSearchTerm}"
                    </p>
                </div>
            )}

            {hasResults && (
                <div className="space-y-4">
                    <p className="text-cyan-400/80">
                        Found {data.results.length} result{data.results.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {data.results.map((podcast) => (
                            <PodcastCard key={podcast.id} podcast={podcast} />
                        ))}
                    </div>
                </div>
            )}

            {/* Initial State - No search yet */}
            {!searchTerm && !isLoading && (
                <div className="text-center py-16">
                    <FaSearch className="text-6xl text-cyan-500/20 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Search for podcasts</h2>
                    <p className="text-cyan-400/60">
                        Find your favorite topics, creators, and more
                    </p>
                </div>
            )}
        </div>
    );
}