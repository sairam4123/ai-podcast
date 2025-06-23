import { useParams } from "react-router";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { FaPlay, FaSpinner } from "react-icons/fa";
import { Podcast } from "../@types/Podcast";
import { useGetImage } from "../api/getImage";
import { formatDuration } from "../utils/formatDuration";
import { Conversation } from "../@components/Conversation";
import Button from "../@components/Button";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";

export function PodcastNew() {
  const { podcast_id } = useParams<{ podcast_id: string }>();
  const { data, isLoading, error } = api.useGetPodcast({
    podcastId: podcast_id,
  });
  return (
    <main className="flex flex-col h-screen min-h-screen bg-radial from-sky-700 to-blue-900">
      <NavBar />
      <div className="flex flex-col flex-grow gap-4 overflow-hidden p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <FaSpinner className="animate-spin text-4xl text-gray-200" />
          </div>
        ) : (data as unknown as number[])?.[1] === 404 ? (
          <NotFound />
        ) : (
          <PodcastCard podcast={data?.podcast} />
        )}
        {error && (
          <div className="text-red-500 text-center w-full">
            Error loading podcast: {error.message}
          </div>
        )}
      </div>
    </main>
  );
}

export function PodcastCard({ podcast }: { podcast?: Podcast }) {
  const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );

  const { play, pause, setSourceUrl, isPlaying } = useMediaPlayerContext();

  const { imageUrl } = useGetImage({ podcastId: podcast?.id ?? "" });
  const { setCurrentPodcast } = usePodcastContext();
  const { data, isLoading, error } = api.useGetConversation({
    podcastId: podcast?.id,
  });

  return (
    <div className="flex flex-row flex-1 gap-4 overflow-hidden">
      <div className="flex flex-col flex-1/5 bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
        <img
          src={imageUrl ?? "/podcastplaceholdercover.png"}
          alt={podcast?.podcast_title}
          className="w-48 aspect-square mx-auto h-auto object-cover rounded-lg"
        />
        <h2 className="text-xl font-bold text-white">
          {podcast?.podcast_title}
        </h2>
        <p className="text-gray-200">{podcast?.podcast_description}</p>
        <p className="text-gray-400 text-sm">
          {podcast?.duration ? formatDuration(podcast?.duration) : "N/A"}
        </p>
        <div className="flex flex-row items-center flex-wrap justify-start gap-2">
          {podcast?.tags?.map((tag, index) => (
            <span
              key={index}
              className="bg-sky-300 text-nowrap text-black px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-row items-center justify-between mt-2">
          <Button
            isLoading={audioLoading}
            onClick={() => {
              if (isPlaying) {
                pause();
              } else {
                setSourceUrl(audioUrl ?? "");
                setCurrentPodcast(podcast!);
                play();
              }
            }}
          >
            <FaPlay className="inline mr-2" />
            Play
          </Button>
        </div>
      </div>
      <div className="flex flex-col flex-2/3 bg-sky-500/20 border overflow-hidden border-sky-300/50 space-y-2 p-2 rounded-lg">
        <h2 className="text-xl font-bold text-white">Transcript</h2>

        {(data as unknown as number[])?.[1] === 404 ||
        (data?.conversations?.length === 0 && !isLoading) ? (
          <TranscriptMissing />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <FaSpinner className="animate-spin text-4xl text-gray-200" />
          </div>
        ) : error ? (
          <p className="text-red-500">
            Error loading transcript: {error.message}
          </p>
        ) : (
          <p className="text-gray-200 hidden"></p>
        )}

        {data?.conversations && (
          <Conversation
            podcastId={podcast?.id ?? ""}
            conversation={data?.conversations ?? []}
          />
        )}
      </div>
    </div>
  );
}

export function TranscriptMissing() {
  return (
    <div className="flex flex-col flex-grow justify-center items-center space-y-2 p-2 rounded-lg">
      <img
        src="/transcriptmissing.png"
        alt="Transcript Missing"
        className="aspect-square h-64 mb-4"
      />
      <h1 className="text-4xl ml-4 mt-2 font-black text-shadow-md text-white">
        Transcript Missing
      </h1>
      <p className="text-lg text-gray-200">
        This podcast does not have a transcript available.
      </p>
    </div>
  );
}

export function NotFound() {
  const { podcast_id } = useParams<{ podcast_id: string }>();
  return (
    <div className="flex flex-col flex-grow justify-center items-center bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
      <img
        src="/notfound.png"
        alt="Podcast Not Found"
        className="aspect-square h-64 mb-4"
      />
      <h1 className="text-4xl ml-4 mt-2 font-black text-shadow-md text-white">
        404 - Podcast Not Found
      </h1>
      <p className="text-lg text-gray-200">
        The podcast with ID <span className="font-bold">{podcast_id}</span> does
        not exist or has been removed.
      </p>
    </div>
  );
}
