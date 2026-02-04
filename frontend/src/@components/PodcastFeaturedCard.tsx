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
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => navigate(`/podcast/${podcast?.id}`)}
      className="relative cursor-pointer min-w-80 w-80 h-52 m-3 rounded-2xl overflow-hidden group shadow-lg shadow-black/30"
    >
      {/* Background Image */}
      <img
        src={image}
        alt={podcast?.podcast_title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Dark Gradient Overlay - stronger for better readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

      {/* Cyan accent glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/10 group-hover:to-blue-600/20 transition-all duration-300" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        {/* Title and Description */}
        <h3 className="font-heading text-lg font-bold text-white line-clamp-1 drop-shadow-lg">
          {podcast?.podcast_title ?? "Podcast Title"}
        </h3>
        <p className="text-sm text-white/80 line-clamp-2 mt-1 drop-shadow-md">
          {podcast?.podcast_description ?? "Description..."}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <FaHeadphones className="text-cyan-400" />
              {formatNumber(podcast?.view_count ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <FaThumbsUp className="text-cyan-400" />
              {formatNumber(podcast?.like_count ?? 0)}
            </span>
            <span className="text-white/60">
              {formatDuration(podcast?.duration)}
            </span>
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlay}
            className={cn(
              "w-11 h-11 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/30 active:scale-95",
              audioLoading && "opacity-50 cursor-wait"
            )}
          >
            <FaPlay className="text-white text-sm ml-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-white/10 rounded-md shimmer", className)} />
  );
}

export function PodcastFeaturedCardSkeleton() {
  return (
    <div className="relative min-w-80 w-80 h-52 m-3 rounded-2xl overflow-hidden bg-cyan-950/60 shadow-lg">
      <ShimmerBlock className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 gap-2">
        <ShimmerBlock className="h-5 w-3/4" />
        <ShimmerBlock className="h-4 w-full" />
        <ShimmerBlock className="h-4 w-5/6" />
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-3">
            <ShimmerBlock className="h-4 w-12" />
            <ShimmerBlock className="h-4 w-12" />
          </div>
          <ShimmerBlock className="w-11 h-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}
