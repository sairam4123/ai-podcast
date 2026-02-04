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
        "shimmer rounded-lg bg-surface-highlight",
        className
      )}
    />
  );
}

export default function PodcastCardSkeleton() {
  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden bg-surface pulse-loader border border-tertiary/10">
      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 space-y-2 bg-gradient-to-t from-surface to-transparent">
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
      // Use flex flex-col to manage vertical layout naturally without calc()
      className="flex flex-col relative cursor-pointer select-none w-full md:aspect-[3/4] rounded-2xl overflow-hidden bg-surface group shadow-sm border border-tertiary/10 hover:shadow-md hover:border-tertiary/30"
    >
      {/* Upper Section: Image & Overlay - Fixed Height (Responsive) */}
      <div className="relative w-full h-40 md:h-48 flex-shrink-0 bg-surface-highlight">
        <img
          src={imageUrl ?? "/podcastplaceholdercover.png"}
          alt={podcast?.podcast_title}
          className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75 group-hover:scale-105"
        />

        {/* Play/Pause Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            isCurrentPodcast && "opacity-100"
          )}
        >
          {audioLoading && isCurrentPodcast ? (
            <FaSpinner className="text-4xl text-white/90 animate-spin drop-shadow-md" />
          ) : isPlaying && isCurrentPodcast ? (
            <button
              onClick={handlePause}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors border border-white/20 shadow-lg group-active:scale-95"
            >
              <FaPause className="text-xl text-white" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors border border-white/20 shadow-lg group-active:scale-95"
            >
              <FaPlay className="text-xl text-white ml-0.5" />
            </button>
          )}
        </div>

        {/* Mobile ONLY: Persistent Play Button (Bottom Right) */}
        {!isPlaying && (
          <div className="absolute bottom-2 right-2 md:hidden">
            <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md">
              <FaPlay className="text-xs text-white ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Lower Section: Content - Fills remaining space */}
      <div className="flex-1 flex flex-col justify-between p-3 bg-surface border-t border-tertiary/10 min-h-0">
        <div className="min-h-0">
          <h3
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/podcast/${podcast?.id}`);
            }}
            className="font-heading font-semibold text-tertiary-foreground text-sm line-clamp-1 hover:text-primary transition-colors cursor-pointer"
          >
            {podcast?.podcast_title}
          </h3>
          {/* Mobile: 3 lines, Desktop: 1 line */}
          <p className="text-xs text-tertiary line-clamp-3 md:line-clamp-1 mt-1 leading-normal">
            {podcast?.podcast_description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 mt-2 text-[10px] text-tertiary/70 font-medium flex-shrink-0">
          <span className="flex items-center gap-1">
            <FaPlay className="text-[8px]" /> {formatNumber(podcast?.view_count ?? 0)}
          </span>
          <FaCircle className="text-[3px] opacity-40" />
          <span className="flex items-center gap-1">
            <FaThumbsUp className="text-[8px]" /> {formatNumber(podcast?.like_count ?? 0)}
          </span>
          <FaCircle className="text-[3px] opacity-40 max-[350px]:hidden" />
          <span className="max-[350px]:hidden">{getRelativeTime(podcast?.created_at ?? null)}</span>
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
      className="h-24 w-full bg-surface rounded-xl overflow-hidden flex gap-3 hover:bg-surface-highlight hover:border-tertiary/30 border border-tertiary/10 transition-all cursor-pointer group"
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative h-24 w-24 flex-shrink-0">
        <img
          className={cn(
            "h-full w-full object-cover",
            !imageUrl && "animate-pulse bg-surface-highlight"
          )}
          src={imageUrl ?? "/podcastplaceholdercover.png"}
          alt={podcast?.podcast_title}
        />
        {isCurrentPodcast && isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white mx-0.5 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white mx-0.5 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white mx-0.5 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center py-2 pr-3 flex-1 min-w-0">
        <a
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/podcast/${podcast?.id}`);
          }}
          href={`/podcast/${podcast?.id}`}
          className="font-heading font-semibold text-tertiary-foreground text-sm line-clamp-1 hover:text-primary transition-colors"
        >
          {podcast?.podcast_title}
        </a>
        <p className="text-xs text-tertiary line-clamp-1 mt-0.5 group-hover:text-tertiary-foreground/80 transition-colors">
          {podcast?.podcast_description}
        </p>
        <div className="flex items-center justify-between mt-auto mb-1 text-[10px] text-tertiary">
          <span>{formatDuration(podcast?.last_known_position ?? 0)} / {formatDuration(podcast?.duration)}</span>
        </div>
      </div>
    </motion.div>
  );
}
