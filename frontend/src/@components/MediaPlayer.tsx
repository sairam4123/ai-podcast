import {
  FaBackward,
  FaForward,
  FaPause,
  FaPlay,
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaShare,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa";
import { api } from "../api/api";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import { formatDuration } from "../utils/formatDuration";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import SlidingTitle from "./SlidingTitle";
import toast from "react-hot-toast";
import Spinner from "./Spinner";

export function MediaPlayer() {
  const { currentPosition, isPlaying, pause, play, seek } = useMediaPlayerContext();
  const {
    currentPodcast,
    isCurrentPodcastLiked,
    isCurrentPodcastDisliked,
    setIsCurrentPodcastLiked,
    setIsCurrentPodcastDisliked,
  } = usePodcastContext();
  const navigate = useNavigate();

  const { imageUrl } = api.useGetImage({ podcastId: currentPodcast?.id ?? "" });

  const { mutate: likePodcast, isLoading: likeLoading } = api.useLikePodcast({
    onSuccess: () => toast.success("Podcast liked"),
  });

  const { mutate: dislikePodcast, isLoading: dislikeLoading } = api.useDislikePodcast({
    onSuccess: () => toast.success("Podcast disliked"),
  });

  const onShare = () => {
    if (!currentPodcast?.id) return;
    const podcastUrl = `${window.location.origin}/podcast/${currentPodcast.id}`;
    navigator.clipboard.writeText(podcastUrl).then(() => toast.success("Link copied"));
  };

  if (!currentPodcast?.id) return null;

  return (
    <AnimatePresence>
      {currentPodcast?.id && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ ease: "easeOut", duration: 0.3 }}
          className="fixed bottom-[4.5rem] lg:bottom-0 right-0 left-0 lg:left-64 h-20 lg:h-24 bg-surface/95 backdrop-blur-xl border-t border-tertiary/20 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-40 flex flex-col justify-center"
        >
          <div className="flex flex-row items-center gap-6 px-4 lg:px-8 max-w-[1920px] mx-auto w-full h-full">
            <img
              className="h-16 w-16 rounded-lg object-cover flex-shrink-0 shadow-sm ring-1 ring-white/10"
              src={imageUrl ?? "/podcastplaceholdercover.png"}
              alt=""
            />
            <div className="flex flex-col flex-grow min-w-0">
              <SlidingTitle>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/podcast/${currentPodcast?.id}`);
                  }}
                  className="font-heading font-semibold text-tertiary-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {currentPodcast?.podcast_title ?? "Podcast Title.."}
                </a>
              </SlidingTitle>
              <p className="text-xs text-tertiary line-clamp-1 mt-0.5">
                {currentPodcast?.podcast_description ?? "Description..."}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-secondary-foreground/70 font-medium tabular-nums">{formatDuration(currentPosition)}</span>

                <div className="flex items-center gap-5">
                  <FaBackward
                    onClick={() => seek(Math.max(currentPosition - 15, 0))}
                    className="text-lg text-tertiary hover:text-primary cursor-pointer transition-colors"
                  />
                  {isPlaying ? (
                    <FaPause
                      onClick={() => pause()}
                      className="text-xl text-primary cursor-pointer hover:scale-110 transition-all"
                    />
                  ) : (
                    <FaPlay
                      onClick={() => play()}
                      className="text-xl text-primary cursor-pointer hover:scale-110 transition-all"
                    />
                  )}
                  <FaForward
                    onClick={() => seek(Math.min(currentPosition + 15, currentPodcast.duration))}
                    className="text-lg text-tertiary hover:text-primary cursor-pointer transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {(likeLoading || dislikeLoading) && <Spinner color="primary" size="sm" />}
                  {currentPodcast.liked_by_user || isCurrentPodcastLiked ? (
                    <FaThumbsUp
                      onClick={() => {
                        setIsCurrentPodcastLiked(false);
                        setIsCurrentPodcastDisliked(currentPodcast.disliked_by_user ?? false);
                        likePodcast({ podcast_id: currentPodcast.id, liked: false });
                      }}
                      className="text-lg hidden md:block text-primary cursor-pointer hover:text-primary-foreground transition-colors"
                    />
                  ) : (
                    <FaRegThumbsUp
                      onClick={() => {
                        setIsCurrentPodcastLiked(true);
                        setIsCurrentPodcastDisliked(false);
                        likePodcast({ podcast_id: currentPodcast.id, liked: true });
                      }}
                      className="text-lg hidden md:block text-tertiary cursor-pointer hover:text-primary transition-colors"
                    />
                  )}
                  {currentPodcast.disliked_by_user || isCurrentPodcastDisliked ? (
                    <FaThumbsDown
                      onClick={() => {
                        dislikePodcast({ podcast_id: currentPodcast.id, disliked: false });
                        setIsCurrentPodcastDisliked(false);
                        setIsCurrentPodcastLiked(currentPodcast?.liked_by_user ?? false);
                      }}
                      className="text-lg hidden md:block text-primary cursor-pointer hover:text-primary-foreground transition-colors"
                    />
                  ) : (
                    <FaRegThumbsDown
                      onClick={() => {
                        dislikePodcast({ podcast_id: currentPodcast.id, disliked: true });
                        setIsCurrentPodcastDisliked(true);
                        setIsCurrentPodcastLiked(false);
                      }}
                      className="text-lg hidden md:block text-tertiary cursor-pointer hover:text-primary transition-colors"
                    />
                  )}
                  <FaShare
                    onClick={onShare}
                    className="text-lg text-tertiary cursor-pointer hover:text-primary transition-colors"
                  />
                  <span className="text-xs text-secondary-foreground/70 font-medium tabular-nums">{formatDuration(currentPodcast?.duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar (Top of player) */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-surface-highlight group cursor-pointer">
            <div className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 bottom-0 z-20" />
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all relative"
              style={{ width: `${(currentPosition / currentPodcast.duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
