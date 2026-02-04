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
          className="fixed flex flex-col h-28 bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl rounded-2xl bg-cyan-950/95 backdrop-blur-md border border-cyan-500/20 shadow-2xl shadow-cyan-900/30 z-50"
        >
          <div className="flex flex-row flex-grow items-center gap-3 p-2">
            <img
              className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
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
                  className="font-heading font-semibold text-white hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {currentPodcast?.podcast_title ?? "Podcast Title.."}
                </a>
              </SlidingTitle>
              <p className="text-xs text-cyan-300/60 line-clamp-1 mt-0.5">
                {currentPodcast?.podcast_description ?? "Description..."}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-cyan-400/60">{formatDuration(currentPosition)}</span>

                <div className="flex items-center gap-4">
                  <FaBackward
                    onClick={() => seek(Math.max(currentPosition - 15, 0))}
                    className="text-lg text-cyan-300/70 hover:text-cyan-200 cursor-pointer transition-colors"
                  />
                  {isPlaying ? (
                    <FaPause
                      onClick={() => pause()}
                      className="text-xl text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
                    />
                  ) : (
                    <FaPlay
                      onClick={() => play()}
                      className="text-xl text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
                    />
                  )}
                  <FaForward
                    onClick={() => seek(Math.min(currentPosition + 15, currentPodcast.duration))}
                    className="text-lg text-cyan-300/70 hover:text-cyan-200 cursor-pointer transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {(likeLoading || dislikeLoading) && <Spinner className="text-cyan-400" size="sm" />}
                  {currentPodcast.liked_by_user || isCurrentPodcastLiked ? (
                    <FaThumbsUp
                      onClick={() => {
                        setIsCurrentPodcastLiked(false);
                        setIsCurrentPodcastDisliked(currentPodcast.disliked_by_user ?? false);
                        likePodcast({ podcast_id: currentPodcast.id, liked: false });
                      }}
                      className="text-lg hidden md:block text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
                    />
                  ) : (
                    <FaRegThumbsUp
                      onClick={() => {
                        setIsCurrentPodcastLiked(true);
                        setIsCurrentPodcastDisliked(false);
                        likePodcast({ podcast_id: currentPodcast.id, liked: true });
                      }}
                      className="text-lg hidden md:block text-cyan-400/60 cursor-pointer hover:text-cyan-300 transition-colors"
                    />
                  )}
                  {currentPodcast.disliked_by_user || isCurrentPodcastDisliked ? (
                    <FaThumbsDown
                      onClick={() => {
                        dislikePodcast({ podcast_id: currentPodcast.id, disliked: false });
                        setIsCurrentPodcastDisliked(false);
                        setIsCurrentPodcastLiked(currentPodcast?.liked_by_user ?? false);
                      }}
                      className="text-lg hidden md:block text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
                    />
                  ) : (
                    <FaRegThumbsDown
                      onClick={() => {
                        dislikePodcast({ podcast_id: currentPodcast.id, disliked: true });
                        setIsCurrentPodcastDisliked(true);
                        setIsCurrentPodcastLiked(false);
                      }}
                      className="text-lg hidden md:block text-cyan-400/60 cursor-pointer hover:text-cyan-300 transition-colors"
                    />
                  )}
                  <FaShare
                    onClick={onShare}
                    className="text-lg text-cyan-400/60 cursor-pointer hover:text-cyan-300 transition-colors"
                  />
                  <span className="text-xs text-cyan-400/60">{formatDuration(currentPodcast?.duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-2 pb-2">
            <div className="w-full h-1 bg-cyan-900/50 rounded-full overflow-hidden group hover:h-2 transition-all">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                style={{ width: `${(currentPosition / currentPodcast.duration) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
