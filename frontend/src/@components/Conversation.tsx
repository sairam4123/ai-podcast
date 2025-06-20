import { FaSpinner } from "react-icons/fa";
import { Podcast } from "../@types/Podcast";
import { useGetAvatarImage } from "../api/getAvatarImage";
import { cn } from "../lib/cn";
import { removeSSMLtags } from "../lib/removeSSMLtags";
import { Conversation as ConversationType } from "../@types/Conversation";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";


export function Conversation({
    podcastId,
    conversation
}: {
    podcastId: Podcast["id"]
    conversation: ConversationType[]
}) {

    const { isPlaying, currentPosition, play, seek } = useMediaPlayerContext()
    const { currentPodcast } = usePodcastContext();

    const isCurrentPodcast = currentPodcast?.id === podcastId

    return <div className="flex flex-col items-start justify-start w-full p-2 px-4 overflow-y-scroll mt-4 space-y-4">
                            {conversation?.map((conv, index) => 
                                {
                                    const currentSpeaker = conv.speaker
                                    const isCurrent = (currentPosition > (conv.start_time ?? 0) && currentPosition < (conv.end_time ?? 0) && isPlaying) && isCurrentPodcast
                                    if (isCurrent) {
                                        // focus the element (good idea?)
                                        setTimeout(() => {
                                            const element = document.getElementById(`conversation-${index}`)
                                            if (element) {
                                                element.scrollIntoView({ behavior: "smooth", block: "center" })
                                            }
                                        }, 0)
                                    }
                                    return <MessageCard
                                    onClick={() => {
                                       if (isCurrentPodcast) {
                                            seek(conv.start_time)
                                            play() // just in case it's paused
                                        }
                                    }}
                                    key={index}

                                        podcastId={podcastId}
                                        person={currentSpeaker}
                                        message={conv}
                                        isCurrent={isCurrent}
                                        currentPosition={currentPosition}
                                        isPlaying={isPlaying}
                                        isHost={conv.podcast_author?.is_host}
                                        id={`conversation-${index}`}
                                    />
                                }
                            )}
                        </div>
}



const MessageCard = ({message: conv, podcastId, person, isCurrent, onClick, currentPosition, isPlaying, id, isHost}: {
    message: ConversationType
    podcastId: Podcast["id"]
    person: ConversationType["speaker"]
    isCurrent: boolean;
    currentPosition: number;
    isPlaying: boolean;
    id: string;
    onClick: () => void;
    isHost?: boolean;
}) => {

    // const {imageUrl, isLoading} = useGetAvatarImage({podcastId, personId: person.id})
    // console.log(imageUrl)
    if (isCurrent)
        console.log(((currentPosition - (conv.start_time ?? 0)) / ((conv.end_time ?? 0) - (conv.start_time ?? 0))) * 100, conv.start_time, conv.end_time, currentPosition, isPlaying)

    return <div id={id} className={`flex ${isHost ? `bg-gradient-to-tl from-blue-600/70 to-blue-800/90 ml-auto rounded-t-3xl rounded-l-3xl md:rounded-l-2xl rounded-br-md md:rounded-br-lg` : `bg-gradient-to-tr from-green-700/80 to-green-800/90 rounded-t-3xl rounded-bl-md md:rounded-bl-lg md:rounded-r-2xl rounded-r-3xl`} text-white animate-slideInBottom max-w-6/7 md:max-w-4/7 lg:max-w-3/7 drop-shadow-lg transition-all ${(currentPosition > (conv.start_time ?? 0) && currentPosition < (conv.end_time ?? 0) && isPlaying) ? "outline-1 outline-white scale-105" : ""} hover:drop-shadow-xl cursor-pointer hover:scale-[1.02] p-3`}
                                        onClick={() => {
                                            onClick();
                                        }}
                                        >
                                    <div className="flex flex-row items-start">
                                        {/* <FaSpinner className={cn("text-4xl text-gray-200", isLoading ? "animate-spin" : "hidden")} />
                                        <img className={cn("h-5 w-5 md:h-6 md:w-6 mr-2 aspect-square rounded-full", isLoading && "hidden")} src={imageUrl} /> */}
                                    <div className="">
                                        <p className="text-sm md:text-base text-shadow-md font-bold text-gray-200">{person?.name}</p>
                                        <p className="relative text-xs md:text-sm z-10">{removeSSMLtags(conv.text)}
                                            
                                        {isCurrent && (
                                            <div
                                            className={`absolute transition-all ease-out duration-75 inset-0 w-full h-full bg-yellow-400/30 z-0`}
                                            style={{
                                                width: `${((currentPosition - (conv.start_time ?? 0)) / ((conv.end_time ?? 0) - (conv.start_time ?? 0))) * 100}%`,
                                            }}
                                            />
                                        )}
                                        </p>
                                    </div>
                                    </div>
                                </div>

}