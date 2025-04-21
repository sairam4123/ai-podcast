import { useParams, useSearchParams } from "react-router"
import { useGetPodcast } from "../api/getPodcast"
import { formatDuration } from "../lib/formatDuration"
import { FaPlay, FaRepeat, FaSpinner } from "react-icons/fa6"
import { useGetImage } from "../api/getImage"
import { useGetAudio } from "../api/getAudio"
import { useAudioPlayer } from "../hooks/useAudioPlayer"
import { cn } from "../lib/cn"
import { FaPause } from "react-icons/fa"
import { removeSSMLtags } from "../lib/removeSSMLtags"

export function Podcast() {
    const params = useParams()
    // console.log(searchParams)
    const podcastId = params.podcast_id
    const {data, isLoading, error} = useGetPodcast({podcastId})
    const {imageUrl, isLoading: imageLoading, error: imageError} = useGetImage({podcastId})
    const {audioUrl, isLoading: audioLoading, error: audioError, refetch: refetchAudio} = useGetAudio({podcast_id: podcastId}, {enabled: false})
    const {audioRef, toggle, isPlaying, currentPosition} = useAudioPlayer()
    console.log(data, isLoading, error, isPlaying)
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-sky-200 to-[130%] to-blue-700">
            <p className="text-5xl font-black mt-8 text-shadow-md text-white mb-5">
                AI PODCAST
            </p>
            <div className="flex flex-col mb-8 min-h-[95%] items-center justify-center bg-zinc-800/20 drop-shadow-lg drop-shadow-black/20 backdrop-blur-lg w-5/6  p-2 rounded-xl mt-6">
                {isLoading && <div className="flex flex-col items-center p-8 justify-center gap-4">
                    <FaSpinner className="animate-spin text-5xl text-gray-200" />
                    <p className="text font-bold text-gray-200 my-1">Loading...</p>
                </div>}
                {error && <p className="text font-bold text-gray-200 my-1">Error: {error.message}</p>}
                {data && (
                    <div className="flex flex-col items-start justify-center w-full h-full">
                        <div className="flex flex-col md:flex-row animate-slideInBottom space-x-6 p-2">
                            <img src={imageUrl ?? "https://plus.unsplash.com/premium_photo-1673967831980-1d377baaded2?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y2F0c3xlbnwwfHwwfHx8MA%3D%3D"} alt="Podcast" className="flex md:max-h-50 md:max-w-50 w-full aspect-square h-auto md:w-auto mask-r-from-60% mask-t-from-80% mask-b-from-80% mask-l-from-80% rounded-lg" />
                            <div className="flex flex-col items-start justify-center w-full py-2 pr-2 -ml-1 space-y-1">
                                <h1 className="text-2xl md:text-4xl text-white font-bold">{data.podcast.podcast_title}</h1>
                                <p className="text-sm md:text-lg text-gray-300">{data.podcast.podcast_description}</p>
                                <p className="text-sm md:text-lg font-bold text-gray-200">{formatDuration(data.podcast.duration)} - {formatDuration(currentPosition)}</p>
                                <div className="flex flex-row space-x-4">
                                    {/* <p className="text-sm font-bold text-gray-400">{data.podcast.interviewer}</p>
                                    <p className="text-sm font-bold text-gray-400">{data.podcast.speaker}</p> */}
                                    <button onClick={() => {
                                        if (!audioUrl) {
                                            refetchAudio()
                                        }
                                        toggle()
                                    }} className={cn("transition-all flex bg-zinc-600 items-center justify-center gap-x-2 group/play cursor-pointer flex-row active:bg-zinc-950 active:scale-[0.97] drop-shadow-sm drop-shadow-black text-white hover:bg-zinc-500 rounded-lg p-2")}>
                                            {isPlaying ? <div className="animate-pulse flex items-center justify-center gap-x-2"><FaPause className="text-lg group-active/play:text-zinc-300" /><p className="md:flex hidden">Pause</p></div> : <><FaPlay className="text-lg group-active/play:text-zinc-300" /><p className="md:flex hidden">Play</p></>}
                                        </button>
                                        <button className="transition-all flex bg-zinc-600 group/repeat items-center justify-center gap-x-2 cursor-pointer flex-row active:bg-zinc-950 active:scale-[0.97] drop-shadow-sm drop-shadow-black text-white hover:bg-zinc-500 rounded-lg p-2">
                                            <FaRepeat className="text-lg group-active/repeat:text-zinc-300" /><p className="md:flex hidden">Regenerate</p>
                                        </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* <p className="text-sm font-bold text-gray-400">{data.podcast.interviewer}</p> */}
                        {/* <p className="text-sm font-bold text-gray-400">{data.podcast.speaker}</p> */}
                        <div className="flex flex-col items-start justify-start w-full p-2 px-4 mt-4 h-96 overflow-y-scroll space-y-4">
                            {data.podcast.conversation?.map((conv, index) => 
                                {
                                    const isCurrent = (currentPosition > (conv.start_time ?? 0) && currentPosition < (conv.end_time ?? 0) && isPlaying)
                                    if (isCurrent) {
                                        // focus the element (good idea?)
                                        setTimeout(() => {
                                            const element = document.getElementById(`conversation-${index}`)
                                            if (element) {
                                                element.scrollIntoView({ behavior: "smooth", block: "center" })
                                            }
                                        }, 0)
                                    }
                                    return <div key={index} id={`conversation-${index}`} className={`flex ${conv.speaker === "interviewer" ? `bg-gradient-to-tl from-blue-600/70 to-blue-800/90 ml-auto rounded-t-3xl rounded-l-3xl md:rounded-l-2xl rounded-br-md md:rounded-br-lg` : `bg-gradient-to-tr from-green-700/80 to-green-800/90 rounded-t-3xl rounded-bl-md md:rounded-bl-lg md:rounded-r-2xl rounded-r-3xl`} text-white animate-slideInBottom max-w-4/7 lg:max-w-3/7 drop-shadow-lg transition-all ${(currentPosition > (conv.start_time ?? 0) && currentPosition < (conv.end_time ?? 0) && isPlaying) ? "outline-1 outline-white scale-105" : ""} hover:drop-shadow-xl cursor-pointer hover:scale-[1.02] p-3`} style={{animationDelay: `${index * 0.15}s`, animationFillMode: "both"}}
                                        onClick={() => {
                                            if (audioRef.current && conv.start_time && conv.end_time) {
                                                audioRef.current.currentTime = conv.start_time
                                                audioRef.current.play()
                                            }
                                        }}
                                        >
                                    <p className="relative">
                                        <span className="relative z-10">{removeSSMLtags(conv.text)}</span>
                                        {isCurrent && (
                                            <span
                                            className="absolute left-0 top-0 h-full bg-yellow-400/30 z-0 animate-[highlightGrow_4s_linear_forwards]"
                                            style={{ animationDuration: `${(conv.end_time! - conv.start_time!)}s`, width: "100%" }}
                                            />
                                        )}
                                    </p>
                                </div>}
                            )}
                        </div>
                    </div>
                )}
            </div>
            <audio ref={audioRef} src={audioUrl ?? ""} className="hidden" controls />
        </div>
    )   
}