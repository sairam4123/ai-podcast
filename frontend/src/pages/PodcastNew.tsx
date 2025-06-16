import { useParams } from "react-router";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { FaSpinner } from "react-icons/fa";

export function PodcastNew() {
    const { podcast_id } = useParams<{podcast_id: string}>();
    const {data, isLoading, error } = api.useGetPodcast({podcastId: podcast_id });
    console.log(data)
    return (
        <main className="flex flex-col min-h-screen bg-radial from-sky-700 to-blue-900">
            <NavBar />
            <div className="flex flex-col flex-grow gap-4 p-4">
                {isLoading ? <div className="flex flex-col items-center justify-center flex-grow">
                    <FaSpinner className="animate-spin text-4xl text-gray-200" />
                </div> : data?.[1] === 404 ? <NotFound /> :
                <></>}
            </div>
        </main>
    )
}


export function NotFound() {
    const { podcast_id } = useParams<{podcast_id: string}>();
    return (<div className="flex flex-col flex-grow justify-center items-center bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
                    <img src="/vite.svg" alt="Podcast Not Found" className="aspect-square h-32 mb-4" />
                    <h1 className="text-4xl ml-4 mt-2 font-black text-shadow-md text-white">
                        404 - Podcast Not Found
                    </h1>
                    <p className="text-lg text-gray-200">
                        The podcast with ID <span className="font-bold">{podcast_id}</span> does not exist or has been removed.
                    </p>
                </div>)
}