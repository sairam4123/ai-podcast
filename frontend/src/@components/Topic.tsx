import { FaPause, FaPlay } from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { Podcast } from "../@types/Podcast";
import { useGetAudio } from "../api/getAudio";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { formatDuration } from "../utils/formatDuration";
import { useGetImage } from "../api/getImage";
import { useNavigate } from "react-router";
import Spinner from "./Spinner";

export function TopicComponent({
  staggerIndex,
  ...props
}: { staggerIndex: number } & Podcast) {

  const { audioUrl, isLoading } = useGetAudio({ podcast_id: props.id }, { enabled: false });
  const { imageUrl, isLoading: imageLoading } = useGetImage({ podcastId: props.id });
  const { audioRef, isPlaying, toggle } = useAudioPlayer({})

  const navigate = useNavigate();

  console.log(imageUrl)
  const defaultImage = "https://plus.unsplash.com/premium_photo-1673967831980-1d377baaded2?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y2F0c3xlbnwwfHwwfHx8MA%3D%3D"
  // useEffect(() => {
  //   if (audioRef.current && audioBlob) {
  //     const audioUrl = URL.createObjectURL(audioBlob);
  //     audioRef.current.src = audioUrl;
  //     audioRef.current.play();
  //     console.log(audioRef.current.src)
  //   }
  //   // return () => {
  //   //   if (audioRef.current) {
  //   //     audioRef.current.pause();
  //   //     audioRef.current.src = ""; // Clear the source to release the object URL
  //   //   }
  //   // };
  // }, [audioBlob]);

  // console.log(audioRef.current?.paused)

  return (
    <div
      key={props.id}
      className="flex group animate-popIn max-h-20 transition-all w-full flex-row items-center justify-center hover:bg-zinc-600/40 bg-zinc-700/40 drop-shadow-sm drop-shadow-black/20 hover:drop-shadow-black hover:drop-shadow-md hover:scale-[1.01] rounded-lg space-x-3"
      style={{
        animationDelay: `${staggerIndex * 0.15}s`,
        animationFillMode: "both",
      }}
      onClick={() => {
        // window.location.href = `/podcast/${props.id}`; // navigate to the podcast page (HACK FOR NOW)
        // replace with href in the future
        navigate(`/podcast/${props.id}`)
      }}
    >
      {imageLoading ? <div className="max-w-10 max-h-10 md:max-w-20 w-full h-full p-2 md:max-h-20 aspect-auto flex items-center justify-center mask-r-from-60% mask-t-from-80% mask-b-from-80% mask-l-from-80% rounded-lg">
        <Spinner size="lg" color="white" />
      </div>
        : <img
          src={imageUrl ?? defaultImage}
          className="flex starting:opacity-0 transition-all opacity-100 max-h-10 md:max-h-20 aspect-square h-full w-auto mask-r-from-60% mask-t-from-80% mask-b-from-80% mask-l-from-80% rounded-lg"
        />}
      <div className="flex flex-row items-center justify-center w-full py-2 pr-2 -ml-1">
        <div className="flex flex-col items-start justify-center w-full space-y-1">
          <p className="md:text-lg text-sm select-none font-bold w-full text-left flex grow text-gray-100">
            {props.podcast_title ?? "Podcast Title"}
          </p>
          <p className="text-sm/5 select-none font-medium line-clamp-1 -mt-2 text-gray-300">
            {props.podcast_description ?? "Podcast Description"}
          </p>
          <p className="text-sm select-none font-bold text-gray-400">{formatDuration(props.duration) ?? "3:45"}</p>
        </div>
        <div className="flex flex-row px-2 items-center justify-end space-x-6">
          <div className="lg:flex transition-all hidden group-hover:opacity-100 opacity-0 flex-row items-center justify-center space-x-2">
            <button onClick={() => {
              //  if (!audioRef.current?.src) {
              //   refetch()
              //  }
              toggle()
            }} className="transition-all bg-zinc-600 group/play cursor-pointer active:bg-zinc-950 active:scale-[0.97] drop-shadow-sm drop-shadow-black text-white hover:bg-zinc-500 rounded-lg p-2">
              {isLoading ? <Spinner size="sm" color="white" /> : (!isPlaying) ? <FaPlay className="text-lg group-active/play:text-zinc-300" /> : <FaPause className="text-lg group-active/play:text-zinc-300 animate-pulse" />}
            </button>
            <button className="transition-all bg-zinc-600 group/repeat cursor-pointer active:bg-zinc-950 active:scale-[0.97] drop-shadow-sm drop-shadow-black text-white hover:bg-zinc-500 rounded-lg p-2">
              <FaRepeat className="text-lg group-active/repeat:text-zinc-300" />
            </button>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={audioUrl ?? undefined} controls className="hidden" />
    </div>
  );
}
