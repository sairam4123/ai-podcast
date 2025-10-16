import { useParams } from "react-router";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import {
  FaEye,
  FaEyeSlash,
  FaPlay,
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaShare,
  FaSpinner,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa";
import { Podcast } from "../@types/Podcast";
import { useGetImage } from "../api/getImage";
// import { formatDuration } from "../utils/formatDuration";
import { Conversation } from "../@components/Conversation";
import Button from "../@components/Button";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import toast from "react-hot-toast";
import Spinner from "../@components/Spinner";
import { useGetAvatarImage } from "../api/getAvatarImage";

export function PodcastNew() {
  const { podcast_id } = useParams<{ podcast_id: string }>();
  const { data, isLoading, error, refetch } = api.useGetPodcast({
    podcastId: podcast_id,
  });

  return (
    <main className="flex flex-col lg:h-screen min-h-screen bg-radial from-sky-950 to-black">
      <NavBar />
      <div className="flex flex-col flex-grow gap-4 overflow-hidden p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <FaSpinner className="animate-spin text-4xl text-gray-200" />
          </div>
        ) : (data as unknown as number[])?.[1] === 404 ? (
          <NotFound />
        ) : (
          <PodcastCard refetch={refetch} podcast={data?.podcast} />
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

export function PodcastCard({
  podcast,
  refetch,
}: {
  podcast?: Podcast;
  refetch?: () => void;
}) {
  const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );

  const { play, pause, setSourceUrl, isPlaying } = useMediaPlayerContext({
    autoPlay: true,
  });

  const { imageUrl } = useGetImage({ podcastId: podcast?.id ?? "" });
  const { setCurrentPodcast } = usePodcastContext();
  const { data, isLoading, error } = api.useGetConversation({
    podcastId: podcast?.id,
  });

  const { data: liveQuestions, refetch: refreshQuestions } =
    api.useGetPodcastQuestions(
      { podcast_id: podcast?.id ?? "" },
      { enabled: !!podcast?.id }
    );

  console.log({ liveQuestions });

  const { mutate: likePodcast, isLoading: likeLoading } = api.useLikePodcast({
    onSuccess: () => {
      toast.success("Podcast liked successfully");
      refetch?.();
    },
  });

  const { mutate: dislikePodcast, isLoading: dislikeLoading } =
    api.useDislikePodcast({
      onSuccess: () => {
        toast.success("Podcast disliked successfully");
        refetch?.();
      },
    });

  const { mutate, isLoading: updateVisibilityLoading } =
    api.useUpdatePodcastVisibility({
      onSuccess: ({ data }) => {
        if (Array.isArray(data) && data[1] === 404) {
          toast.error("Podcast not found");
          return;
        }
        if (Array.isArray(data) && data[0].emsg) {
          toast.error(data[0].emsg);
          return;
        }
        console.log("Podcast visibility updated successfully", data);
        toast.success("Podcast visibility updated successfully");
        refetch?.();
      },
    });

  const people =
    data?.conversations
      ?.map((c) => c.speaker)
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i) || [];

  return (
    <div className="flex flex-col lg:flex-row flex-1 gap-4 pb-32 overflow-hidden">
      <>
        <title>{podcast?.podcast_title}</title>
        <link rel="icon" href={`${imageUrl}`} precedence="high" />
        <meta
          name="description"
          content={podcast?.podcast_description || "Podcast details"}
        />
        <meta
          name="og:title"
          content={podcast?.podcast_title || "Podcast details"}
        />
        <meta
          name="og:description"
          content={podcast?.podcast_description || "Podcast details"}
        />
        <meta
          name="og:image"
          content={imageUrl || "/podcastplaceholdercover.png"}
        />
        <meta name="og:type" content="audio" />
        <meta
          name="og:url"
          content={`https://podolli-ai.co.in/podcast/${podcast?.id}`}
        />
      </>
      <div className="flex flex-col flex-1/5 bg-sky-500/20 border overflow-y-auto border-sky-300/50 space-y-2 p-2 rounded-lg">
        <img
          src={imageUrl ?? "/podcastplaceholdercover.png"}
          alt={podcast?.podcast_title}
          className="w-32 aspect-square mx-auto h-auto object-cover rounded-lg"
        />
        <h2 className="text-xl font-bold text-white">
          {podcast?.podcast_title}
        </h2>
        <p className="text-gray-200">{podcast?.podcast_description}</p>
        {/* <p className="text-gray-400 text-sm">
          {podcast?.duration ? formatDuration(podcast?.duration) : "N/A"}
        </p> */}
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
        <div className="flex flex-row gap-2 items-center mt-2 flex-wrap">
          <Button
            className="py-3 px-4"
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
            <FaPlay className="inline" />
          </Button>
          <Button
            onClick={() => {
              mutate({
                podcast_id: podcast?.id ?? "",
                is_public: !podcast?.is_public,
              });
            }}
          >
            {updateVisibilityLoading ? (
              <>
                <Spinner className="inline mr-2" />
              </>
            ) : podcast?.is_public ? (
              <>
                <FaEye className="inline mr-2" />
                Public
              </>
            ) : (
              <>
                <FaEyeSlash className="inline mr-2" />
                Private
              </>
            )}
          </Button>

          <Button
            isLoading={likeLoading}
            onClick={() => {
              likePodcast({
                podcast_id: podcast?.id ?? "",
                liked: !(podcast?.liked_by_user ?? false),
              });
            }}
            className="py-3 px-4"
          >
            {/* {<FaThumbsUp className="inline mr-2" />} */}
            {podcast?.liked_by_user ? (
              <FaThumbsUp className="inline" />
            ) : (
              <FaRegThumbsUp className="inline" />
            )}
          </Button>
          <Button
            isLoading={dislikeLoading}
            onClick={() => {
              dislikePodcast({
                podcast_id: podcast?.id ?? "",
                disliked: !(podcast?.disliked_by_user ?? false),
              });
            }}
            className="py-3 px-4"
          >
            {podcast?.disliked_by_user ? (
              <FaThumbsDown className="inline" />
            ) : (
              <FaRegThumbsDown className="inline" />
            )}
          </Button>
          <Button
            className="py-3 px-4"
            onClick={() => {
              const podcastUrl = `${window.location.origin}/podcast/${podcast?.id}`;
              navigator.clipboard.writeText(podcastUrl).then(() => {
                toast.success("Podcast link copied to clipboard");
              });
            }}
          >
            {<FaShare className="inline" />}
          </Button>
        </div>
        <div className="flex flex-col">
          <p className="text-gray-200">People</p>
          <div className="flex flex-row mt-2">
            {people?.map((person, index) => (
              <PersonAvatarImage key={index} personId={person.id} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-2/3 max-h-[32rem] lg:max-h-full bg-sky-500/20 border overflow-hidden border-sky-300/50 space-y-2 p-2 rounded-lg">
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
            questions={liveQuestions?.questions || []}
            refreshQuestions={() => {
              refreshQuestions?.();
            }}
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

function PersonAvatarImage({
  personId,
  first,
}: {
  personId: string;
  first?: boolean;
}) {
  const { imageUrl, isLoading } = useGetAvatarImage({ personId });
  return (
    <img
      className={`h-10 w-10 ${
        first ? "" : "mr-2"
      } aspect-square rounded-full border-2 border-sky-500 ${
        isLoading ? "hidden" : ""
      }`}
      src={imageUrl || "/userplaceholder.png"}
      alt="Person Avatar"
    />
  );
}
