import { SearchBox } from "../@components/SearchBox"
import { FaCircle, FaDotCircle, FaEye, FaPlayCircle } from "react-icons/fa"
import { useEffect, useRef, useState } from "react"
import { FaPlay } from "react-icons/fa6"
import { Podcast } from "../@types/Podcast"
import { api } from "../api/api"

export function Home() {

    const {data, error, isLoading} = api.useGetAllPodcast({
        limit: 10,
        offset: 4,
    })
    return <main className="flex flex-col min-h-screen bg-radial from-sky-700 to-blue-900">
    <NavBar />
    <div className="flex flex-col flex-grow gap-4 p-4">
        <div className="flex flex-col bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl font-black text-shadow-md text-white">
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
            <p className="text-2xl font-black text-shadow-md text-white">
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
            <p className="text-2xl font-black text-shadow-md text-white">
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

    const {imageUrl, isLoading, error} = api.useGetImage({podcastId: podcast?.id}, {enabled: !!podcast?.id});

    return (
        <div className="relative cursor-pointer active:scale-[0.98] select-none w-48 h-64 hover:brightness-110 group/card hover:scale-[1.03] border border-sky-800/20 transition-all ease-out shadow-md hover:shadow-black/80 shadow-black/60 m-3 min-w-48 bg-sky-500/50 rounded-lg">
                    <img src={imageUrl ?? "https://i.pinimg.com/736x/e4/fb/2a/e4fb2a1bf8d9ca39b869fa412d72fce2.jpg"} alt="Podcast" className="flex md:max-h-50 md:max-w-50 w-full aspect-square h-auto md:w-auto mask-r-from-60% mask-t-from-80% mask-b-from-80% mask-l-from-80% rounded-lg" />
                    <div className="absolute inset-0 flex flex-col justify-end p-2 gap-0.5 bg-linear-180 from-transparent to-black/50 from-60% rounded-lg">
                        <p className="text-lg font-bold line-clamp-1 text-white">{podcast?.podcast_title}</p>
                        <p className="text-xs -mt-1 transition-all text-gray-300 mask-r-from-80% line-clamp-3 mask-r-to-100% overflow-clip text-nowrap group-hover/card:mask-r-to-100% group-hover/card:mask-r-from-100% group-hover/card:text-wrap">
                            {podcast?.podcast_description}    
                        </p>
                        <p className="flex flex-row items-center gap-1.5 text-gray-200 text-xs">
                            <span className="flex-row flex items-center gap-1">
                                <FaPlay className="text-gray-200 text-[10px]"/> 2.5K
                            </span>
                            <FaCircle className="text-gray-200 text-[5px]" />
                            <span>
                                2 days ago
                            </span>
                        </p>
                    </div>
                    <div className="absolute inset-0 group-hover/card:flex hidden">
                        <div className="flex items-center justify-center w-48 h-48">
                        <FaPlay className="text-6xl text-white active:scale-75 opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
    )
}

export function NavBar() {
    return <nav>
        <ul className="flex text-base flex-row items-center space-x-4 p-4 from-sky-700/50 shadow-black/30 shadow-lg to-blue-700/50 bg-linear-330 text-white">
            <li className="font-black text-xl text-shadow-md uppercase"><a href="/">AI&nbsp;Podcast</a></li>
            <li className=""><a href="/podcasts">Podcasts</a></li>
            <li className=""><a href="/podcasts">Pricing</a></li>
            <li className="w-full text-base flex justify-center">
                <SearchBox variant="xl" />
            </li>
            <li className="">
                <a className="text-gray-200 hover:text-white transition-colors">
                    Sign&nbsp;In
                </a>
            </li>
        </ul>
    </nav>
}