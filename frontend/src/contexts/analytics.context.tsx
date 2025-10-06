type AnalyticsContextType = {
  lastAnalyticsUpdate: number;
  setLastAnalyticsUpdate: (timestamp: number) => void;
};

import { createContext, useContext, useEffect, useState } from "react";
import { usePlayPressed } from "../api/analytics/playPressed";
import { usePodcastContext } from "./podcast.context";
import { useMediaPlayerContext } from "./mediaPlayer.context";
import { useCurrentPositionChanged } from "../api/analytics/positionChanged";

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

export function useAnalyticsContext() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error(
      "useAnalyticsContext must be used within a AnalyticsProvider"
    );
  }
  return ctx;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [lastAnalyticsUpdate, setLastAnalyticsUpdate] = useState(0);
  const [lastKnownPosition, setLastKnownPosition] = useState(0);

  const { currentPodcast } = usePodcastContext();
  const { isPlaying, currentPosition } = useMediaPlayerContext();

  const { mutate } = usePlayPressed();
  const { mutate: playingMutate } = useCurrentPositionChanged();

  useEffect(() => {
    console.log("Current podcast changed:", currentPodcast, "isPlaying");
    if (!currentPodcast?.id) return;
    console.log("Podcast is playing, will call mutate in 10 seconds");
    try {
      mutate({ podcast_id: currentPodcast?.id ?? "" });
      setLastAnalyticsUpdate(Date.now());
    } catch (error) {
      console.error("Error while mutating playPressed:", error);
    }
  }, [currentPodcast, currentPodcast?.id]);

  useEffect(() => {
    if (!currentPodcast?.id) return;
    if (!isPlaying) return;
    // console.log(currentPosition % 10 <= 0.5, currentPosition > 0);
    if (
      (currentPosition > 0 &&
        currentPosition % 30 <= 0.5 &&
        Date.now() - lastAnalyticsUpdate > 9500) || // at least 9.5 seconds since last update
      Math.abs(currentPosition - lastKnownPosition) > 15 // or user seeked more than 15 seconds
    ) {
      console.log(
        "Current position is at a 30 second mark, sending analytics for podcast:",
        currentPodcast?.id
      );
      try {
        playingMutate({
          podcast_id: currentPodcast?.id ?? "",
          position: currentPosition,
        });
        setLastAnalyticsUpdate(Date.now());
        setLastKnownPosition(currentPosition);
      } catch (error) {
        console.error("Error while mutating playPressed:", error);
      }
    }
  }, [
    currentPodcast,
    currentPodcast?.id,
    isPlaying,
    currentPosition,
    lastAnalyticsUpdate,
  ]);

  return (
    <AnalyticsContext.Provider
      value={{
        lastAnalyticsUpdate,
        setLastAnalyticsUpdate,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}
