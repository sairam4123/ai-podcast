// PodcastCardSkeleton.tsx
import { motion } from "framer-motion";
import clsx from "clsx";
import { FaPlay, FaPause, FaSpinner, FaCircle } from "react-icons/fa";
import { useNavigate } from "react-router";
import { Podcast } from "../@types/Podcast";
import { api } from "../api/api";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import { cn } from "../lib/cn";
import { getRelativeTime } from "../utils/getRelativeTime";
import { formatNumber } from "../utils/formatNumber";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
};

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-slate-300/50",
        className,
        "rounded-md"
      )}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        style={{ ...shimmerStyle }}
      />
    </div>
  );
}

export default function PodcastCardSkeleton() {
  return (
    <div className="relative cursor-pointer z-1 w-48 h-64 border border-sky-800/20 transition-all ease-out shadow-md shadow-black/60 m-3 min-w-48 bg-sky-500/30 rounded-lg overflow-hidden select-none">
      {/* Image shimmer */}
      <ShimmerBlock className="w-full h-47 rounded-lg" />

      {/* Content shimmer */}
      <div className="absolute inset-0 flex flex-col justify-end p-2 gap-1 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-lg">
        <ShimmerBlock className="h-5 w-11/12" /> {/* Title */}
        <ShimmerBlock className="h-3 w-4/5" /> {/* Desc line 1 */}
        <div className="flex items-center gap-2 mt-1">
          <ShimmerBlock className="h-3 w-8 rounded-sm" />
          <ShimmerBlock className="h-3 w-16 rounded-sm" />
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

  //     const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // //     console.log("User's Time Zone:", currentTimeZone);

  // //     console.log("created_at from DB:", podcast?.created_at);
  // // console.log("Parsed Date:",  Date.parse(podcast?.created_at));
  // // console.log("Now:", new Date());

  return (
    <div onClick={(e) => {
      e.stopPropagation();
      console.log("Clicked on podcast card", podcast?.id);
      setSourceUrl(audioUrl);
      setCurrentPodcast(podcast!);
      if (!isPlaying || !isCurrentPodcast) {
        play();
      }
    }} className="relative cursor-pointer z-1 active:scale-[0.98] select-none w-48 h-64 hover:brightness-110 group/card hover:scale-[1.03] border border-sky-900/20 transition-all ease-out shadow-md hover:shadow-black/80 shadow-black/60 m-3 min-w-48 bg-sky-950/50 rounded-lg">
      <img
        src={imageUrl ?? "/podcastplaceholdercover.png"}
        alt="Podcast"
        className="flex group-hover/card:brightness-60 group-hover/card:blur-[1px] transition-all w-48 md:max-h-48 object-cover flex-grow object-center overflow-clip md:max-w-48 aspect-square h-auto md:w-auto mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97% rounded-lg"
      />

      <div
        className={cn(
          "absolute inset-0 group-hover/card:flex hidden",
          isCurrentPodcast && "flex"
        )}
      >
        <div
          onClick={() => {
            setSourceUrl(audioUrl);
            setCurrentPodcast(podcast!);
          }}
          className="flex items-center justify-center w-48 h-48"
        >
          <FaPlay
            onClick={(e) => {
              e.stopPropagation();
              if (!isPlaying || !isCurrentPodcast) {
                setSourceUrl(audioUrl);
                setCurrentPodcast(podcast!);
              }
              console.log("Playing podcast", podcast?.id, isCurrentPodcast);
              if (!isPlaying && isCurrentPodcast) {
                play();
              }
            }}
            className="text-6xl text-gray-200 opacity-75 active:scale-75 hover:text-white ease-in-out duration-75 transition-opacity"
            style={{
              display:
                (audioLoading || isPlaying) && isCurrentPodcast
                  ? "none"
                  : "flex",
            }}
          />
          <FaPause
            onClick={(e) => {
              e.stopPropagation();
              pause();
            }}
            className="text-6xl text-gray-200 opacity-75 active:scale-75 hover:text-white ease-in-out duration-75 transition-opacity"
            style={{
              display:
                ((audioLoading || !isPlaying) && isCurrentPodcast) ||
                !isCurrentPodcast
                  ? "none"
                  : "flex",
            }}
          />
          <FaSpinner
            className="animate-spin text-6xl text-gray-200 opacity-75 hover:text-white ease-in-out duration-75 transition-opacity"
            style={{
              display: audioLoading ? "flex" : "none",
            }}
          />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2 gap-0.5 bg-linear-180 from-transparent to-black/50 from-60% rounded-lg ">
        <p
          onClick={() => {
            console.log("Clicked on podcast title", podcast?.id);
            navigate(`/podcast/${podcast?.id}`);
          }}
          className="text-lg group-hover/card:text-base transition-all pointer-events-auto font-bold line-clamp-1 hover:underline text-white"
        >
          {podcast?.podcast_title}
        </p>
        <p className="text-xs group-hover/card:text-[12px] -mt-1 transition-all text-gray-300 mask-r-from-80% line-clamp-2 mask-r-to-100% overflow-clip text-nowrap group-hover/card:mask-r-to-100% group-hover/card:mask-r-from-100% group-hover/card:text-wrap">
          {podcast?.podcast_description}
        </p>
        <p className="flex flex-row items-center gap-1.5 text-gray-200 text-xs">
          <span className="flex-row flex items-center gap-1">
            <FaPlay className="text-gray-200 text-[10px]" /> {formatNumber(podcast?.view_count ?? 0)}
          </span>
          <FaCircle className="text-gray-200 text-[5px]" />
          <span>
            {getRelativeTime(podcast?.created_at ?? null)}
            {/* <TimeAgo date={getRelativeTime(podcast?.created_at)} /> */}
          </span>
        </p>
      </div>
    </div>
  );
}
