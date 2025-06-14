import { Podcast } from "../@types/Podcast";

type PodcastContextType = {
    currentPodcast: Podcast;
    setCurrentPodcast: (podcast: Podcast) => void;
    isPodcastPlaying: boolean;
    setIsPodcastPlaying: (isPlaying: boolean) => void;
}

import { createContext, useContext, useState } from "react";

const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

export function usePodcastContext() {
    const ctx = useContext(PodcastContext);
    if (!ctx) {
        throw new Error("usePodcastContext must be used within a PodcastProvider");
    }
    return ctx;
}

export function PodcastProvider({ children }: { children: React.ReactNode }) {
    const [currentPodcast, setCurrentPodcast] = useState<Podcast>({} as Podcast);
    const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);

    return (
        <PodcastContext.Provider value={{ currentPodcast, setCurrentPodcast, isPodcastPlaying, setIsPodcastPlaying }}>
            {children}
        </PodcastContext.Provider>
    );
}