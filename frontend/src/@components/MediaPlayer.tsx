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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ ease: "easeOut", duration: 0.2 }}
          className="fixed flex flex-col h-28 bottom-24 lg:bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl rounded-2xl bg-surface/90 backdrop-blur-md border border-tertiary/20 shadow-2xl shadow-black/20 z-50 ring-1 ring-white/5"
        >
          <div className="flex flex-row flex-grow items-center gap-4 p-2 pr-4">
            <img
              className="h-20 w-20 rounded-xl object-cover flex-shrink-0 shadow-sm ring-1 ring-white/10"
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

          {/* Progress Bar */}
          <div className="px-2 pb-2">
            <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden group hover:h-2 transition-all cursor-pointer">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(currentPosition / currentPodcast.duration) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
