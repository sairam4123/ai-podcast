import { Podcast } from "../@types/Podcast";

type PodcastContextType = {
  currentPodcast: Podcast;
  setCurrentPodcast: (podcast: Podcast) => void;
  isPodcastPlaying: boolean;
  setIsPodcastPlaying: (isPlaying: boolean) => void;
};

import { createContext, useContext, useEffect, useState } from "react";
import { usePlayPressed } from "../api/analytics/playPressed";

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

  const { mutate } = usePlayPressed();

  useEffect(() => {
    console.log("Current podcast changed:", currentPodcast, "isPlaying");
    if (!currentPodcast?.id) return;
    // if (!isPodcastPlaying) return;
    console.log("Podcast is playing, will call mutate in 10 seconds");
    try {
      mutate({ podcast_id: currentPodcast?.id ?? "" });
    } catch (error) {
      console.error("Error while mutating playPressed:", error);
    }
  }, [currentPodcast, currentPodcast?.id]);

  return (
    <PodcastContext.Provider
      value={{
        currentPodcast,
        setCurrentPodcast,
        isPodcastPlaying,
        setIsPodcastPlaying,
      }}
    >
      {children}
    </PodcastContext.Provider>
  );
}
