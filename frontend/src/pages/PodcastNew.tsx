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
    <main className="flex flex-col lg:h-screen min-h-screen">
      <NavBar />
      <div className="flex flex-col flex-grow gap-4 overflow-hidden p-4 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <FaSpinner className="animate-spin text-4xl text-slate-400" />
          </div>
        ) : (data as unknown as number[])?.[1] === 404 ? (
          <NotFound />
        ) : (
          <PodcastCard refetch={refetch} podcast={data?.podcast} />
        )}
        {error && (
          <div className="text-red-400 text-center w-full">
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
        <meta name="description" content={podcast?.podcast_description || "Podcast details"} />
        <meta name="og:title" content={podcast?.podcast_title || "Podcast details"} />
        <meta name="og:description" content={podcast?.podcast_description || "Podcast details"} />
        <meta name="og:image" content={imageUrl || "/podcastplaceholdercover.png"} />
        <meta name="og:type" content="audio" />
        <meta name="og:url" content={`https://podolli-ai.co.in/podcast/${podcast?.id}`} />
      </>

      {/* Sidebar */}
      <div className="flex flex-col lg:w-80 glass-panel p-4 space-y-4 overflow-y-auto">
        <img
          src={imageUrl ?? "/podcastplaceholdercover.png"}
          alt={podcast?.podcast_title}
          className="w-32 aspect-square mx-auto h-auto object-cover rounded-xl"
        />
        <h2 className="font-heading text-xl font-bold text-white text-center">
          {podcast?.podcast_title}
        </h2>
        <p className="text-slate-300 text-sm">{podcast?.podcast_description}</p>

        <div className="flex flex-wrap gap-2">
          {podcast?.tags?.map((tag, index) => (
            <span
              key={index}
              className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button isLoading={audioLoading} onClick={() => {
            if (isPlaying) {
              pause();
            } else {
              setSourceUrl(audioUrl ?? "");
              setCurrentPodcast(podcast!);
              play();
            }
          }}>
            <FaPlay className="inline" />
          </Button>

          <Button variant="secondary" onClick={() => {
            mutate({
              podcast_id: podcast?.id ?? "",
              is_public: !podcast?.is_public,
            });
          }}>
            {updateVisibilityLoading ? (
              <Spinner className="inline" />
            ) : podcast?.is_public ? (
              <><FaEye className="inline mr-1" /> Public</>
            ) : (
              <><FaEyeSlash className="inline mr-1" /> Private</>
            )}
          </Button>

          <Button variant="secondary" isLoading={likeLoading} onClick={() => {
            likePodcast({
              podcast_id: podcast?.id ?? "",
              liked: !(podcast?.liked_by_user ?? false),
            });
          }}>
            {podcast?.liked_by_user ? <FaThumbsUp /> : <FaRegThumbsUp />}
          </Button>

          <Button variant="secondary" isLoading={dislikeLoading} onClick={() => {
            dislikePodcast({
              podcast_id: podcast?.id ?? "",
              disliked: !(podcast?.disliked_by_user ?? false),
            });
          }}>
            {podcast?.disliked_by_user ? <FaThumbsDown /> : <FaRegThumbsDown />}
          </Button>

          <Button variant="secondary" onClick={() => {
            const podcastUrl = `${window.location.origin}/podcast/${podcast?.id}`;
            navigator.clipboard.writeText(podcastUrl).then(() => {
              toast.success("Link copied to clipboard");
            });
          }}>
            <FaShare />
          </Button>
        </div>

        <div>
          <p className="text-slate-400 text-sm mb-2">People</p>
          <div className="flex">
            {people?.map((person, index) => (
              <PersonAvatarImage key={index} personId={person.id} />
            ))}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex flex-col flex-1 glass-panel p-4 overflow-hidden">
        <h2 className="font-heading text-xl font-semibold text-white mb-3">Transcript</h2>

        {(data as unknown as number[])?.[1] === 404 ||
          (data?.conversations?.length === 0 && !isLoading) ? (
          <TranscriptMissing />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <FaSpinner className="animate-spin text-4xl text-slate-400" />
          </div>
        ) : error ? (
          <p className="text-red-400">Error loading transcript: {error.message}</p>
        ) : null}

        {data?.conversations && (
          <Conversation
            podcastId={podcast?.id ?? ""}
            conversation={data?.conversations ?? []}
            questions={liveQuestions?.questions || []}
            refreshQuestions={() => refreshQuestions?.()}
          />
        )}
      </div>
    </div>
  );
}

export function TranscriptMissing() {
  return (
    <div className="flex flex-col flex-grow justify-center items-center space-y-4 p-4">
      <img src="/transcriptmissing.png" alt="Transcript Missing" className="h-48 opacity-60" />
      <h1 className="font-heading text-2xl font-bold text-white">Transcript Missing</h1>
      <p className="text-slate-400">This podcast does not have a transcript available.</p>
    </div>
  );
}

export function NotFound() {
  const { podcast_id } = useParams<{ podcast_id: string }>();
  return (
    <div className="flex flex-col flex-grow justify-center items-center glass-panel p-8 space-y-4">
      <img src="/notfound.png" alt="Podcast Not Found" className="h-48 opacity-60" />
      <h1 className="font-heading text-3xl font-bold text-white">404 - Not Found</h1>
      <p className="text-slate-400">
        Podcast <span className="font-semibold text-white">{podcast_id}</span> does not exist.
      </p>
    </div>
  );
}

function PersonAvatarImage({ personId, first }: { personId: string; first?: boolean }) {
  const { imageUrl, isLoading } = useGetAvatarImage({ personId });
  return (
    <img
      className={`h-10 w-10 ${first ? "" : "-ml-2"} rounded-full border-2 border-slate-700 ${isLoading ? "hidden" : ""}`}
      src={imageUrl || "/userplaceholder.png"}
      alt="Person Avatar"
    />
  );
}
