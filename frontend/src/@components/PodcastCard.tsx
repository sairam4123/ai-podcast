import { motion } from "framer-motion";
import clsx from "clsx";
import {
  FaPlay,
  FaPause,
  FaSpinner,
  FaCircle,
  FaThumbsUp,
} from "react-icons/fa";
import { useNavigate } from "react-router";
import { Podcast } from "../@types/Podcast";
import { api } from "../api/api";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import { cn } from "../lib/cn";
import { getRelativeTime } from "../utils/getRelativeTime";
import { formatNumber } from "../utils/formatNumber";
import { formatDuration } from "../utils/formatDuration";

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={clsx(
        "shimmer rounded-lg",
        className
      )}
    />
  );
}

export default function PodcastCardSkeleton() {
  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-cyan-950/60 pulse-loader">
      {/* Image placeholder */}
      <div className="absolute inset-0 shimmer" />

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 space-y-2 bg-gradient-to-t from-black/80 to-transparent">
        <ShimmerBlock className="h-4 w-4/5" />
        <ShimmerBlock className="h-3 w-3/5" />
        <div className="flex items-center gap-2 mt-2">
          <ShimmerBlock className="h-3 w-10" />
          <ShimmerBlock className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

export function PodcastCard({ podcast }: { podcast?: Podcast }) {
  const navigate = useNavigate();
  const { setSourceUrl, isPlaying, pause, play } = useMediaPlayerContext({
    autoPlay: true,
  });
  const { imageUrl } = api.useGetImage({ podcastId: podcast?.id ?? "" });
  const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );
  const { currentPodcast, setCurrentPodcast } = usePodcastContext();
  const isCurrentPodcast = currentPodcast?.id === podcast?.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSourceUrl(audioUrl);
    setCurrentPodcast(podcast!);
    if (!isPlaying || !isCurrentPodcast) {
      play();
    }
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    pause();
  };

  return (
    <motion.div
      onClick={handlePlay}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative cursor-pointer select-none w-full aspect-[3/4] rounded-2xl overflow-hidden bg-cyan-950/60 group shadow-lg shadow-black/20"
    >
      {/* Image */}
      <img
        src={imageUrl ?? "/podcastplaceholdercover.png"}
        alt={podcast?.podcast_title}
        className="w-full h-48 object-cover transition-all duration-200 group-hover:brightness-75"
      />

      {/* Play/Pause Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
          isCurrentPodcast && "opacity-100"
        )}
        style={{ height: "192px" }}
      >
        {audioLoading && isCurrentPodcast ? (
          <FaSpinner className="text-5xl text-white animate-spin" />
        ) : isPlaying && isCurrentPodcast ? (
          <button
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <FaPause className="text-2xl text-white" />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <FaPlay className="text-2xl text-white ml-1" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-cyan-950 via-cyan-950/80 to-transparent">
        <h3
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/podcast/${podcast?.id}`);
          }}
          className="font-heading font-semibold text-white text-sm line-clamp-1 hover:underline cursor-pointer"
        >
          {podcast?.podcast_title}
        </h3>
        <p className="text-xs text-cyan-300/60 line-clamp-1 mt-0.5">
          {podcast?.podcast_description}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-cyan-400/60">
          <span className="flex items-center gap-1">
            <FaPlay className="text-[9px]" /> {formatNumber(podcast?.view_count ?? 0)}
          </span>
          <FaCircle className="text-[4px]" />
          <span className="flex items-center gap-1">
            <FaThumbsUp className="text-[9px]" /> {formatNumber(podcast?.like_count ?? 0)}
          </span>
          <FaCircle className="text-[4px]" />
          <span>{getRelativeTime(podcast?.created_at ?? null)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function HorizontalPodcastCard({ podcast }: { podcast: Podcast }) {
  const navigate = useNavigate();
  const { setSourceUrl, isPlaying, pause, play } = useMediaPlayerContext({
    autoPlay: true,
  });
  const { imageUrl } = api.useGetImage({ podcastId: podcast?.id ?? "" });
  const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );
  const { currentPodcast, setCurrentPodcast } = usePodcastContext();
  const isCurrentPodcast = currentPodcast?.id === podcast?.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSourceUrl(audioUrl);
    setCurrentPodcast(podcast!);

    if ((!isPlaying || !isCurrentPodcast) && !audioLoading) {
      play();
    } else if (isPlaying && isCurrentPodcast && !audioLoading) {
      pause();
    }
  };

  return (
    <motion.div
      className="h-28 w-full bg-cyan-950/60 rounded-xl overflow-hidden flex gap-3 hover:bg-cyan-900/60 transition-colors cursor-pointer"
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <img
        className={cn(
          "h-28 w-28 object-cover flex-shrink-0",
          !imageUrl && "animate-pulse bg-cyan-900"
        )}
        src={imageUrl ?? "/podcastplaceholdercover.png"}
        alt={podcast?.podcast_title}
      />
      <div className="flex flex-col justify-center py-2 pr-3 flex-1 min-w-0">
        <a
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/podcast/${podcast?.id}`);
          }}
          href={`/podcast/${podcast?.id}`}
          className="font-heading font-semibold text-white text-sm line-clamp-1 hover:underline"
        >
          {podcast?.podcast_title}
        </a>
        <p className="text-xs text-cyan-300/60 line-clamp-2 mt-0.5">
          {podcast?.podcast_description}
        </p>
        <div className="flex items-center justify-between mt-2 text-xs text-cyan-400/60">
          <span>{formatDuration(podcast?.last_known_position ?? 0)}</span>
          <span>{formatDuration(podcast?.duration)}</span>
        </div>
      </div>
    </motion.div>
  );
}
