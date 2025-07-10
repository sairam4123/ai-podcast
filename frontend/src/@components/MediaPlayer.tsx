import { FaBackward, FaForward, FaPause, FaPlay } from "react-icons/fa";
import { api } from "../api/api";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import { formatDuration } from "../utils/formatDuration";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import SlidingTitle from "./SlidingTitle";

export function MediaPlayer() {
    const {currentPosition, isPlaying, pause, play} = useMediaPlayerContext();
    const {currentPodcast} = usePodcastContext();
    const navigate = useNavigate();

    const {imageUrl} = api.useGetImage({
        podcastId: currentPodcast?.id ?? "",})

    // console.log("Current Podcast in MediaPlayer", currentPodcast);
    if (!currentPodcast?.id) {
        return null; // Don't render the player if no podcast is selected
    }

    return (
        <AnimatePresence>
        {currentPodcast?.id && <motion.div initial={{
            opacity: 0,
            y: 20,
        }} animate={{
            opacity: 1,
            y: 0,
        }} exit={{
            opacity: 0,
            y: 20,
        }} transition={{
            ease: "easeInOut",
            duration: 0.3,
            type: "spring",
        }} className="fixed flex flex-col h-28 drop-shadow-lg drop-shadow-black/50 bottom-4 border border-sky-200 transform -translate-x-1/2 left-1/2 w-11/12 rounded-lg bg-sky-950 z-50">
            <div className="flex flex-row flex-grow items-center gap-2 justify-between">
                <img className="lg:h-26 h-22 w-auto rounded-lg aspect-square mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97%" src={imageUrl ?? "/podcastplaceholdercover.png"}></img>
                <div className="flex flex-col flex-grow">
                    <div className="">
                        <SlidingTitle>
                        <p className="text-lg cursor-pointer font-bold text-gray-100">
                            <a onClick={
                                (e) => {
                                    e.preventDefault();
                                    navigate(`/podcast/${currentPodcast?.id}`);
                                }
                            } className="hover:underline hover:text-sky-50 transition-all duration-150 ease-in-out">
                            {currentPodcast?.podcast_title ?? "Podcast Title.."}
                            </a>
                        </p>
                        </SlidingTitle>
                        <p className="lg:text-sm text-xs line-clamp-2 text-gray-300">{currentPodcast?.podcast_description ?? "Description..."}</p>
                        {/* <p className="text-xs text-gray-400">{formatDuration(currentPodcast?.duration)}</p> */}
                    </div>
                    <div className="flex flex-row items-center justify-between px-2 mt-2">
                        <div className="flex flex-col items-start justify-center">
                            <p className="text-sm font-semibold text-gray-400">{formatDuration(currentPosition)}</p>
                        </div>
                        <div className="flex flex-row items-center justify-center gap-6">
                            <FaBackward className="text-xl text-sky-300 cursor-pointer hover:text-sky-400 transition-all duration-150 ease-in-out" />
                            <FaPlay className="text-xl text-sky-300 cursor-pointer hover:text-sky-400 transition-all duration-150 ease-in-out" onClick={() => {
                                console.log("Play clicked, isPlaying:", isPlaying);
                                if (!isPlaying) {
                                    play();
                                }
                            }} style={{
                                display: isPlaying ? 'none' : 'flex'
                            }} />
                            <FaPause className="text-xl text-sky-300 cursor-pointer hover:text-sky-400 animate-pulse transition-all duration-150 ease-in-out" onClick={() => {
                                if (isPlaying) {
                                    pause();
                                }
                            }} style={{
                                display: isPlaying ? 'flex' : 'none'
                            }} />
                            <FaForward className="text-xl text-sky-300 cursor-pointer hover:text-sky-400 transition-all duration-150 ease-in-out" />
                        </div>
                        <div className="flex flex-col items-end justify-center">
                            <p className="text-sm font-semibold text-gray-400">{formatDuration(currentPodcast?.duration)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            { /* Progress Bar */ }
            <div className="flex flex-col w-full px-0.5 pb-0.5">
                <div className="w-full h-1 hover:h-2 group/progress has-hover:rounded-full bg-neutral-950 rounded-lg">
                    <div className="h-full bg-sky-500 rounded-lg transition-all duration-150 ease-in-out group-hover/progress:rounded-full" style={{ width: `${( 1 - (currentPodcast.duration - currentPosition) / (currentPodcast.duration)) * 100}%` }}></div>
                </div>
            </div>
        </motion.div>}
        </AnimatePresence>
    );
}