import { FaPlay, FaHeadphones, FaThumbsUp } from "react-icons/fa";
import { motion } from "framer-motion";
import { Podcast } from "../@types/Podcast";
import { api } from "../api/api";
import { usePodcastContext } from "../contexts/podcast.context";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { cn } from "../lib/cn";
import { formatNumber } from "../utils/formatNumber";
import { formatDuration } from "../utils/formatDuration";
import { useNavigate } from "react-router";

export default function PodcastFeaturedCard({ podcast }: { podcast: Podcast }) {
  const { setCurrentPodcast, setIsPodcastPlaying } = usePodcastContext();
  const { play, setSourceUrl } = useMediaPlayerContext();
  const navigate = useNavigate();

  const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );

  const { imageUrl } = api.useGetImage({
    podcastId: podcast?.id ?? "",
  });
  const image = imageUrl ?? "/podcastplaceholdercover.png";

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioLoading) return;
    setSourceUrl(audioUrl ?? "");
    setCurrentPodcast(podcast);
    setIsPodcastPlaying(true);
    play();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => navigate(`/podcast/${podcast?.id}`)}
      className="relative cursor-pointer w-full aspect-[4/3] rounded-2xl overflow-hidden group bg-surface shadow-md hover:shadow-lg border border-tertiary/10"
    >
      {/* Background Image */}
      <img
        src={image}
        alt={podcast?.podcast_title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

      {/* Play Button - Shows on hover */}
      <button
        onClick={handlePlay}
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all shadow-lg opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 border border-white/20 hover:bg-black/60",
          audioLoading && "opacity-50 cursor-wait"
        )}
      >
        <FaPlay className="text-white text-lg ml-1" />
      </button>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        {/* Title */}
        <h3 className="font-heading text-lg font-bold text-white line-clamp-2 mb-1 group-hover:text-blue-300 transition-colors">
          {podcast?.podcast_title ?? "Podcast Title"}
        </h3>

        {/* Description */}
        <p className="text-xs text-white/80 line-clamp-2 mb-3">
          {podcast?.podcast_description ?? "Description..."}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-white/70 font-medium h-5">
          <span className="flex items-center gap-1">
            <FaHeadphones className="text-white/90" />
            {formatNumber(podcast?.view_count ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <FaThumbsUp className="text-white/90" />
            {formatNumber(podcast?.like_count ?? 0)}
          </span>
          <span>{formatDuration(podcast?.duration)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function PodcastFeaturedCardSkeleton() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface pulse-loader border border-tertiary/10">
      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-2 bg-gradient-to-t from-background/90 via-background/40 to-transparent">
        <div className="h-5 w-3/4 shimmer rounded-lg bg-surface-highlight" />
        <div className="h-3 w-full shimmer rounded-lg bg-surface-highlight" />
        <div className="h-3 w-5/6 shimmer rounded-lg bg-surface-highlight" />
        <div className="flex gap-3 mt-3">
          <div className="h-3 w-12 shimmer rounded-lg bg-surface-highlight" />
          <div className="h-3 w-12 shimmer rounded-lg bg-surface-highlight" />
          <div className="h-3 w-12 shimmer rounded-lg bg-surface-highlight" />
        </div>
      </div>
    </div>
  );
}
