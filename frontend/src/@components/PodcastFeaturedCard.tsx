import { FaPlay } from "react-icons/fa"
import { Podcast } from "../@types/Podcast"
import { api } from "../api/api"
import { usePodcastContext } from "../contexts/podcast.context"
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context"
import Shimmer from "../@components/Shimmer";
import clsx from "clsx"
import { motion } from "framer-motion"


export default function PodcastFeaturedCard({
    podcast
}: {
    podcast: Podcast
}) {

    const {setCurrentPodcast, setIsPodcastPlaying} = usePodcastContext()
    const {play, setSourceUrl} = useMediaPlayerContext()
    
    const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );

    const {imageUrl} = api.useGetImage({
        podcastId: podcast?.id ?? "",
    })
    const image = imageUrl ?? "/podcastplaceholdercover.png"

    return <div className="relative flex flex-row group/card cursor-pointer z-1 min-w-80 h-48 border border-sky-800/20 transition-all ease-out shadow-md shadow-black/60 m-3 w-80 bg-sky-500/30 rounded-lg overflow-hidden select-none">
        <img
            src={image}
            alt="Podcast"
            className="flex w-full h-full blur-xs group-hover/card:blur-[1px] transition ease-in-out group-hover/card:scale-120 scale-105 object-cover object-center aspect-square mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97% rounded-lg"
        />
        <div className="absolute inset-0 flex justify-end flex-col bg-linear-20 from-black/80 from-45% via-70% via-black/40 p-2 to-transparent rounded-lg">
            <p className="text-white text-2xl w-fit hover:underline font-bold select-none">
                {podcast?.podcast_title ?? "Podcast Title.."}
            </p>

            <div className="flex flex-row">

            <p className="text-white text-sm line-clamp-2 font-sm w-6/7 select-none mt-1 group-hover/card:line-clamp-3 mask-b-from-0.5">
                {podcast?.podcast_description ?? "Description..."}
            </p>

            <p onClick={() => {
                setSourceUrl(audioUrl ?? "");
                setCurrentPodcast(podcast);
                setIsPodcastPlaying(true);
                play();
            }} className="text-white mt-auto text-sm flex w-fit ml-auto items-center justify-center gap-2 text-center rounded-full bg-sky-600 px-4 py-2 hover:bg-sky-500 font-light select-none">
                <FaPlay></FaPlay>
            </p>
            </div>

        </div>
    </div>

}

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



export function PodcastFeaturedCardSkeleton() {
  return (
    <div className="relative flex flex-row group/card cursor-wait z-1 min-w-80 h-48 border border-sky-800/20 shadow-md shadow-black/60 m-3 w-80 bg-sky-500/30 rounded-lg overflow-hidden select-none">
      {/* Image Layer + shimmer */}
      <div className="w-full h-full bg-sky-500/30">
        <ShimmerBlock className="w-full h-full rounded-lg" />
      </div>

      {/* Optional dark overlay */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Text shimmer layer */}
      <div className="absolute inset-0 flex flex-col justify-end p-2 gap-1">
        <ShimmerBlock className="h-5 w-2/3 rounded-md" /> {/* Title */}
        <ShimmerBlock className="h-3 w-5/6 rounded-sm" />
        <ShimmerBlock className="h-3 w-4/5 rounded-sm" />

        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            <ShimmerBlock className="h-3 w-10 rounded-sm" />
            <ShimmerBlock className="h-3 w-16 rounded-sm" />
          </div>
          <ShimmerBlock className="w-10 h-10 rounded-full bg-sky-600" />
        </div>
      </div>
    </div>
  );
}


