import { useEffect, useRef, useState } from "react";

export function useAudioPlayer({autoPlay = false}: { autoPlay?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // const currentPosition = audioRef.current?.currentTime ?? 0;
  const [currentPosition, setCurrentPosition] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const play = () => {
    audioRef.current?.play();
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true)
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentPosition(audio.currentTime);
    };

    intervalRef.current = setInterval(() => {
      if (audio) {
        handleTimeUpdate();
      }
    }, 60);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    // audio.addEventListener("timeupdate", handleTimeUpdate);

    if (autoPlay) {
      audio.play()
      audio.pause()
    }
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  return {
    audioRef,
    isPlaying,
    toggle,
    play,
    currentPosition,
    pause,
  };
}
