import { createContext, useContext, useEffect, useRef, useState } from "react";

type MediaPlayerContextType = {
    isPlaying: boolean;
    pause: () => void;
    play: () => void;

    currentPosition: number;

    sourceUrl: string | null;
    setSourceUrl: (url: string | null) => void;

    toggle: () => void;
};
const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined)

export function useMediaPlayerContext() {
    const ctx = useContext(MediaPlayerContext);
    if (!ctx) {
        throw new Error("useMediaPlayerContext must be used within a MediaPlayerProvider");
    }
    return ctx;
}

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const toggle = () => {
        if (audioRef.current?.paused) {
            audioRef.current?.play();
        } else {
            audioRef.current?.pause();
        }
    };

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.src = sourceUrl ?? "";
        audioRef.current.addEventListener("play", () => setIsPlaying(true));
        audioRef.current.addEventListener("pause", () => setIsPlaying(false));
        audioRef.current.addEventListener("ended", () => setIsPlaying(false));
        
        intervalRef.current = setInterval(() => {
            if (audioRef.current) {
                setCurrentPosition(audioRef.current.currentTime);
            }
        }, 60); // Update current position every 60ms
        if (sourceUrl) {
            audioRef.current.src = sourceUrl;
            audioRef.current.load(); // Load the new source
        }


        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = ""; // Clear the source to release the object URL
                audioRef.current.removeEventListener("play", () => setIsPlaying(true));
                audioRef.current.removeEventListener("pause", () => setIsPlaying(false));
                audioRef.current.removeEventListener("ended", () => setIsPlaying(false));
                
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        };
    }, [sourceUrl]);

    const play = () => {
        audioRef.current?.play();
    };

    const pause = () => {
        audioRef.current?.pause();
    };

    return (
        <MediaPlayerContext.Provider
        value={{
            isPlaying,
            pause,
            play,
            currentPosition,
            sourceUrl,
            setSourceUrl,
            toggle
        }}>
            <audio ref={audioRef} style={{ display: "none" }} />
            {children}
        </MediaPlayerContext.Provider>
    );
}