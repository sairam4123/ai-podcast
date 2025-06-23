import { FaPlay } from "react-icons/fa"
import { Podcast } from "../@types/Podcast"
import { api } from "../api/api"
import { usePodcastContext } from "../contexts/podcast.context"
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context"

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

