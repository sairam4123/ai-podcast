import { FaPlay, FaHeadphones, FaThumbsUp, FaStar } from "react-icons/fa";
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => navigate(`/podcast/${podcast?.id}`)}
      className="relative cursor-pointer w-full flex flex-col md:flex-row rounded-2xl overflow-hidden group bg-surface shadow-sm border border-tertiary/10 hover:shadow-md hover:border-tertiary/30 h-auto md:h-auto md:aspect-[1.9/1]"
    >
      {/* LEFT: Image Section */}
      <div className="relative w-full md:w-1/2 h-48 md:h-full shrink-0">
        <img
          src={image}
          alt={podcast?.podcast_title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Featured Badge */}
        <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1">
          <FaStar className="text-[8px]" /> Featured
        </div>

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <button
            onClick={handlePlay}
            className={cn(
              "w-12 h-12 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center transition-all shadow-lg scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 text-white hover:brightness-110 hover:scale-105",
              audioLoading && "opacity-50 cursor-wait"
            )}
          >
            <FaPlay className="text-xs ml-0.5" />
          </button>
        </div>
      </div>

      {/* RIGHT: Content Section */}
      <div className="relative w-full md:w-1/2 p-5 md:p-6 flex flex-col justify-center bg-surface">
        {/* Decorative gradient bleed */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/0 to-transparent pointer-events-none md:block hidden" />

        <div className="space-y-2 relative z-10">
          <div>
            <h3 className="font-heading text-lg md:text-xl font-bold text-tertiary-foreground line-clamp-2 leading-tight group-hover:underline decoration-primary decoration-2 underline-offset-4 transition-all">
              {podcast?.podcast_title ?? "Podcast Title"}
            </h3>
            <p className="text-xs text-tertiary line-clamp-2 md:line-clamp-3 mt-1.5 leading-relaxed">
              {podcast?.podcast_description ?? "Description..."}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-[10px] text-tertiary font-medium pt-1">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-highlight/50 border border-tertiary/5">
              <FaHeadphones className="text-primary" />
              {formatNumber(podcast?.view_count ?? 0)}
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-highlight/50 border border-tertiary/5">
              <FaThumbsUp className="text-primary" />
              {formatNumber(podcast?.like_count ?? 0)}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-surface-highlight/50 border border-tertiary/5">
              {formatDuration(podcast?.duration)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PodcastFeaturedCardSkeleton() {
  return (
    <div className="relative w-full flex flex-col md:flex-row rounded-2xl overflow-hidden bg-surface pulse-loader border border-tertiary/10 h-auto md:h-auto md:aspect-[1.9/1]">
      {/* Image Skeleton */}
      <div className="w-full md:w-1/2 h-48 md:h-full bg-surface-highlight shimmer" />

      {/* Content Skeleton */}
      <div className="w-full md:w-1/2 p-6 flex flex-col justify-center space-y-4">
        <div className="h-6 w-3/4 bg-surface-highlight shimmer rounded-lg" />
        <div className="h-4 w-full bg-surface-highlight shimmer rounded-md" />
        <div className="h-4 w-5/6 bg-surface-highlight shimmer rounded-md" />
        <div className="flex gap-3 pt-2">
          <div className="h-5 w-12 bg-surface-highlight shimmer rounded-md" />
          <div className="h-5 w-12 bg-surface-highlight shimmer rounded-md" />
        </div>
      </div>
    </div>
  );
}
