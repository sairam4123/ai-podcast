import { SearchBox } from "../@components/SearchBox"
import { FaCircle, FaDotCircle, FaEye, FaPause, FaPlayCircle, FaPlus, FaSpinner } from "react-icons/fa"
import { useEffect, useRef, useState } from "react"
import { FaPlay } from "react-icons/fa6"
import { Podcast } from "../@types/Podcast"
import { api } from "../api/api"
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context"
import { usePodcastContext } from "../contexts/podcast.context"
import { cn } from "../lib/cn"
import { NavBar } from "../@components/NavBar"

export function Home() {

    const {data, error, isLoading} = api.useGetAllPodcast({
        limit: 10,
        offset: 0,
    })
    return <main className="flex flex-col min-h-screen bg-radial from-sky-700 to-blue-900">
    <NavBar />
    <div className="flex flex-col flex-grow gap-4 p-4">
        <div className="flex flex-col bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
                For you
            </p>
            <div className="flex flex-row space-x-2 overflow-auto">
                {data?.results.map((podcast, index) => {
                    return <PodcastCard key={podcast.id} podcast={podcast} />
                })}
                {/* <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard /> */}
            </div>
        </div>
        <div className="flex flex-col bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
                Trending
            </p>
            <div className="flex flex-row space-x-2 overflow-auto">
                {/* <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard /> */}
            </div>
        </div>
        <div className="flex flex-col bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
                Featured
            </p>
            <div className="flex flex-row space-x-2 overflow-auto">
                {/* <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard /> */}
            </div>
        </div>
    </div>
    </main>
}

export function PodcastCard({podcast}: {
    podcast?: Podcast
}) {

    const {setSourceUrl, isPlaying, pause, play} = useMediaPlayerContext({autoPlay: true});
    const {imageUrl, isLoading, error} = api.useGetImage({podcastId: podcast?.id}, {enabled: !!podcast?.id});

    const {audioUrl, isLoading: audioLoading} = api.useGetAudio({podcast_id: podcast?.id ?? ""}, {enabled: !!podcast?.id});

    const {currentPodcast, setCurrentPodcast} = usePodcastContext();

    const isCurrentPodcast = currentPodcast?.id === podcast?.id;

//     const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// //     console.log("User's Time Zone:", currentTimeZone);

// //     console.log("created_at from DB:", podcast?.created_at);
// // console.log("Parsed Date:",  Date.parse(podcast?.created_at));
// // console.log("Now:", new Date());


    return (
        <div onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/podcast/${podcast?.id}`;
        }} className="relative cursor-pointer z-1 active:scale-[0.98] select-none w-48 h-64 hover:brightness-110 group/card hover:scale-[1.03] border border-sky-800/20 transition-all ease-out shadow-md hover:shadow-black/80 shadow-black/60 m-3 min-w-48 bg-sky-500/50 rounded-lg">
                    <img src={imageUrl ?? "https://i.pinimg.com/736x/e4/fb/2a/e4fb2a1bf8d9ca39b869fa412d72fce2.jpg"} alt="Podcast" className="flex w-48 md:max-h-48 object-cover flex-grow object-center overflow-clip md:max-w-48 aspect-square h-auto md:w-auto mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97% rounded-lg" />
                    <div className="absolute inset-0 flex flex-col justify-end p-2 gap-0.5 bg-linear-180 from-transparent to-black/50 from-60% rounded-lg ">
                        <p className="text-lg font-bold line-clamp-1 text-white">{podcast?.podcast_title}</p>
                        <p className="text-xs -mt-1 transition-all text-gray-300 mask-r-from-80% line-clamp-2 mask-r-to-100% overflow-clip text-nowrap group-hover/card:mask-r-to-100% group-hover/card:mask-r-from-100% group-hover/card:text-wrap">
                            {podcast?.podcast_description}    
                        </p>
                        <p className="flex flex-row items-center gap-1.5 text-gray-200 text-xs">
                            <span className="flex-row flex items-center gap-1">
                                <FaPlay className="text-gray-200 text-[10px]"/> 2.5K
                            </span>
                            <FaCircle className="text-gray-200 text-[5px]" />
                            <span>
                                {getRelativeTime(podcast?.created_at)}
                                {/* <TimeAgo date={getRelativeTime(podcast?.created_at)} /> */}
                            </span>
                        </p>
                    </div>
                    <div className={cn("absolute inset-0 group-hover/card:flex hidden", (isCurrentPodcast) && "flex")}>
                        <div onClick={(e) => {
                            e.stopPropagation();
                            setSourceUrl(audioUrl);
                            setCurrentPodcast(podcast);
                        }} className="flex items-center justify-center w-48 h-48">
                            <FaPlay
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isPlaying || !isCurrentPodcast) {
                                    setSourceUrl(audioUrl);
                                    setCurrentPodcast(podcast);
                                }
                                if (isPlaying && isCurrentPodcast) {
                                    pause();
                                }
                            }}
                            className="text-6xl text-white active:scale-75 opacity-60 hover:opacity-100 transition-opacity" style={{
                                display: ((audioLoading || isPlaying) && isCurrentPodcast) ? 'none' : 'flex'
                            }} />
                            <FaPause
                                onClick={(e) => {
                                    e.stopPropagation();
                                    pause();
                                }}
                            className="text-6xl text-white active:scale-75 opacity-60 hover:opacity-100 transition-opacity" style={{
                                display: (audioLoading || !isPlaying) && isCurrentPodcast || !isCurrentPodcast ? 'none' : 'flex',
                            }} />
                            <FaSpinner className="animate-spin text-6xl text-white opacity-60 hover:opacity-100 transition-opacity" style={{
                                display: audioLoading ? 'flex' : 'none'
                            }} />
                        </div>
                    </div>
                </div>
    )
}

function getRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString+"Z"); // assuming UTC string from DB 
  const diff = (now.getTime() - date.getTime()) / 1000; // in seconds

  const times = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const t of times) {
    const delta = Math.floor(diff / t.seconds);
    if (delta >= 1) {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-delta, t.unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return 'just now';
}
