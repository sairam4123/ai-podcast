import { useParams } from "react-router";
import { api } from "../api/api";
import {
  FaEye,
  FaEyeSlash,
  FaPlay,
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaShare,
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
import Spinner, { PageLoader } from "../@components/Spinner";
import { useGetAvatarImage } from "../api/getAvatarImage";

export function PodcastNew() {
  const { podcast_id } = useParams<{ podcast_id: string }>();
  const { data, isLoading, error, refetch } = api.useGetPodcast({
    podcastId: podcast_id,
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 max-w-7xl mx-auto w-full lg:h-[calc(100vh-6rem)]">
      {isLoading ? (
        <PageLoader message="Loading podcast..." />
      ) : (data as unknown as number[])?.[1] === 404 ? (
        <NotFound />
      ) : (
        <PodcastCard refetch={refetch} podcast={data?.podcast} />
      )}
      {error && (
        <div className="text-rose-400 text-center w-full">
          Error loading podcast: {error.message}
        </div>
      )}
    </div>
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
    <div className="flex flex-col lg:flex-row flex-1 gap-6 pb-32 overflow-hidden">
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
      <div className="flex flex-col lg:w-80 glass-panel p-5 space-y-5 overflow-y-auto border border-tertiary/20 bg-surface/40">
        <img
          src={imageUrl ?? "/podcastplaceholdercover.png"}
          alt={podcast?.podcast_title}
          className="w-40 aspect-square h-auto object-cover rounded-2xl shadow-lg ring-1 ring-white/10"
        />
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-tertiary-foreground text-left">
            {podcast?.podcast_title}
          </h2>
          <p className="text-tertiary text-sm text-left leading-relaxed">{podcast?.podcast_description}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-start">
          {podcast?.tags?.map((tag, index) => (
            <span
              key={index}
              className="bg-surface-highlight text-primary px-3 py-1 rounded-full text-xs font-medium border border-tertiary/10"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-start">
          <Button isLoading={audioLoading} onClick={() => {
            if (isPlaying) {
              pause();
            } else {
              setSourceUrl(audioUrl ?? "");
              setCurrentPodcast(podcast!);
              play();
            }
          }} className="w-full sm:w-auto">
            <FaPlay className="inline mr-2" /> Play
          </Button>

          <Button
            variant="secondary"
            isLoading={updateVisibilityLoading}
            onClick={() => {
              mutate({
                podcast_id: podcast?.id ?? "",
                is_public: !podcast?.is_public,
              });
            }}
          >
            {podcast?.is_public ? (
              <><FaEye className="inline mr-1" /> Public</>
            ) : (
              <><FaEyeSlash className="inline mr-1" /> Private</>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-start">
          <Button variant="ghost" isLoading={likeLoading} onClick={() => {
            likePodcast({
              podcast_id: podcast?.id ?? "",
              liked: !(podcast?.liked_by_user ?? false),
            });
          }}>
            {podcast?.liked_by_user ? <FaThumbsUp className="text-primary text-lg" /> : <FaRegThumbsUp className="text-tertiary text-lg" />}
          </Button>

          <Button variant="ghost" isLoading={dislikeLoading} onClick={() => {
            dislikePodcast({
              podcast_id: podcast?.id ?? "",
              disliked: !(podcast?.disliked_by_user ?? false),
            });
          }}>
            {podcast?.disliked_by_user ? <FaThumbsDown className="text-primary text-lg" /> : <FaRegThumbsDown className="text-tertiary text-lg" />}
          </Button>

          <Button variant="ghost" onClick={() => {
            const podcastUrl = `${window.location.origin}/podcast/${podcast?.id}`;
            navigator.clipboard.writeText(podcastUrl).then(() => {
              toast.success("Link copied to clipboard");
            });
          }}>
            <FaShare className="text-tertiary text-lg" />
          </Button>
        </div>

        <div className="pt-4 border-t border-tertiary/10">
          <p className="text-tertiary text-xs uppercase tracking-widest font-semibold mb-3 text-left">Speakers</p>
          <div className="flex justify-start -space-x-2">
            {people?.map((person, index) => (
              <PersonAvatarImage key={index} personId={person.id} first={index === 0} />
            ))}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex flex-col flex-1 glass-panel p-0 overflow-hidden border border-tertiary/20 bg-surface/30">
        <div className="p-4 border-b border-tertiary/10 bg-surface/40 backdrop-blur-sm">
          <h2 className="font-heading text-lg font-semibold text-tertiary-foreground">Transcript</h2>
        </div>

        {(data as unknown as number[])?.[1] === 404 ||
          (data?.conversations?.length === 0 && !isLoading) ? (
          <TranscriptMissing />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <Spinner size="xl" />
          </div>
        ) : error ? (
          <p className="text-rose-400 p-4">Error loading transcript: {error.message}</p>
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
    <div className="flex flex-col flex-grow justify-center items-center space-y-4 p-4 opacity-50">
      <img src="/transcriptmissing.png" alt="Transcript Missing" className="h-40 grayscale contrast-125" />
      <h1 className="font-heading text-xl font-bold text-tertiary">Transcript Missing</h1>
      <p className="text-tertiary/70 text-sm">This podcast does not have a transcript available.</p>
    </div>
  );
}

export function NotFound() {
  const { podcast_id } = useParams<{ podcast_id: string }>();
  return (
    <div className="flex flex-col flex-grow justify-center items-center glass-panel p-8 space-y-4">
      <img src="/notfound.png" alt="Podcast Not Found" className="h-40 opacity-50 grayscale" />
      <h1 className="font-heading text-2xl font-bold text-secondary-foreground">404 - Not Found</h1>
      <p className="text-tertiary">
        Podcast <span className="font-semibold text-primary">{podcast_id}</span> does not exist.
      </p>
    </div>
  );
}

function PersonAvatarImage({ personId, first }: { personId: string; first?: boolean }) {
  const { imageUrl, isLoading } = useGetAvatarImage({ personId });
  return (
    <div className={`relative ${first ? "" : "-ml-3"} transition-transform hover:-translate-y-1 hover:z-10`}>
      <img
        className={`h-10 w-10 rounded-full border-2 border-surface object-cover ${isLoading ? "hidden" : ""}`}
        src={imageUrl || "/userplaceholder.png"}
        alt="Person Avatar"
      />
    </div>
  );
}
