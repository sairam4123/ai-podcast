import { SearchBox } from "./@components/SearchBox";
import { useEffect, useState } from "react";
import { TopicComponent } from "./@components/Topic";
import { FaSpinner } from "react-icons/fa";
import { useSearchPodcast } from "./api/searchPodcasts";
import { useDebounce } from "use-debounce";
import { useGeneratePodcast } from "./api/generatePodcast";
import { GiSparkles } from "react-icons/gi";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { Home } from "./pages/Home";
import { MediaPlayerProvider } from "./contexts/mediaPlayer.context";
import { MediaPlayer } from "./@components/MediaPlayer";

export function AppNew() {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const {isLoading, data, error, refetch} = useSearchPodcast({searchTerm: debouncedSearchTerm});

  const generatePodcastMutation = useGeneratePodcast({
    onSuccess: (data) => {
      console.log("Podcast generated successfully", data);
      refetch();
    },
    onFailure: (error) => {
      console.error("Error generating podcast", error);
    }
  });
  

  return (
    <div className="flex flex-col py-8 items-center justify-center min-h-screen bg-gradient-to-tr from-sky-200 to-[130%] to-blue-700">
      <p className="text-5xl font-black text-shadow-md text-white mb-5">
        AI PODCAST
      </p>
      <div className="flex flex-row items-center justify-center space-x-2 w-full">
      <SearchBox searchTerm={searchTerm} setSearchTerm={(val) => {
        setSearchTerm(val)
      }}/>
      <button disabled={generatePodcastMutation.isLoading} onClick={() => generatePodcastMutation.mutate({topic: searchTerm})} className="transition-all bg-zinc-600 cursor-pointer active:bg-zinc-950 active:scale-[0.97] drop-shadow-sm drop-shadow-black text-white hover:bg-zinc-500 rounded-lg p-2.5 ml-2">
        {generatePodcastMutation.isLoading ? <FaSpinner className="animate-spin text-2xl text-gray-200" /> : <p className="flex items-center justify-center text-lg flex-row gap-2 font-bold">
          <FaWandMagicSparkles className="text-gray-200 text-lg"/><span className="hidden lg:flex">Generate</span>
        </p>}
      </button>
      </div>
      {(!isLoading && searchTerm && searchTerm === debouncedSearchTerm) && <div className="flex flex-col glass-panel items-center justify-center bg-zinc-800/20 drop-shadow-lg drop-shadow-black/20 backdrop-blur-lg w-11/12 md:w-2/3 p-2 rounded-xl mt-6">
        <p className="md:text-lg lg:text-xl text-shadow-black/75 font-bold text-gray-50 text-shadow-xs my-1">
          We've found some topics similar to yours
        </p>
        <div className="flex w-full flex-col items-center p-2 space-y-2 justify-center">
          {data?.results.map((podcast, index) => {
            // console.log("Podcast data", podcast);
            return (
              <TopicComponent
                key={podcast.id}
                staggerIndex={index}
                {...podcast}
                // title={podcast.podcast_title}
                // description={podcast.podcast_description}
                // image={podcast.image}
                // interviewer={podcast.interviewer}
                // speaker={podcast.speaker}
                // conversation={podcast.conversation}
              />
            )
          })}
          {data?.results.length === 0 && <p className="text-sm md:text-base font-bold text-gray-200 my-1">
            No podcasts found for this topic
          </p>}
        </div>
      </div>}
      {
        isLoading && <div className="flex mt-6 flex-col items-center justify-center w-full h-full">
          <FaSpinner className="animate-spin text-5xl text-gray-200" />
        </div>
      }
    </div>
  )
}

export function App() {
  return (
  
    // <MediaPlayerProvider>
      <Home />
      //{/* <MediaPlayer /> */}
    // </MediaPlayerProvider>
    // <div className="flex flex-col py-8 items-center justify-center min-h-screen bg-gradient-to-tr from-sky-200 to-[130%] to-blue-700">
    // </div>
  );
}