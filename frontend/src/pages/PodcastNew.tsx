import { useParams } from "react-router";
import { api } from "../api/api";
import { useState } from "react";
import { cn } from "../lib/cn";
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
  const { data, isLoading, error } = api.useGetPodcast({
    podcastId: podcast_id,
  });

  return (
    <div className="flex flex-col gap-4 p-2 lg:p-4 max-w-7xl mx-auto w-full lg:h-[calc(100vh-6rem)]">
      {isLoading ? (
        <PageLoader message="Loading podcast..." />
      ) : (data as unknown as number[])?.[1] === 404 ? (
        <NotFound />
      ) : (
        <PodcastCard podcast={data?.podcast} />
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
}: {
  podcast?: Podcast;
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

  const [liked, setLiked] = useState(podcast?.liked_by_user ?? false);
  const [disliked, setDisliked] = useState(podcast?.disliked_by_user ?? false);
  const [isPublic, setIsPublic] = useState(podcast?.is_public ?? false);

  // Sync with props if they change (e.g. initial load or refetch)
  useState(() => {
    setLiked(podcast?.liked_by_user ?? false);
    setDisliked(podcast?.disliked_by_user ?? false);
    setIsPublic(podcast?.is_public ?? false);
  });

  const { mutate: likePodcast, isLoading: likeLoading } = api.useLikePodcast({
    onSuccess: () => {
      toast.success("Podcast liked successfully");
    },
  });

  const { mutate: dislikePodcast, isLoading: dislikeLoading } =
    api.useDislikePodcast({
      onSuccess: () => {
        toast.success("Podcast disliked successfully");
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
      },
    });

  const people =
    data?.conversations
      ?.map((c) => c.speaker)
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i) || [];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col flex-1 gap-4 md:gap-0 p-0 md:p-0 w-full h-full md:h-[calc(100vh-5rem)] overflow-hidden relative">
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

      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden relative">
        {/* Transcript - Left Side (Desktop) / Bottom (Mobile) */}
        <div className="flex flex-col flex-1 bg-surface/30 backdrop-blur-xl border-0 md:border-r border-tertiary/20 rounded-3xl md:rounded-r-none overflow-hidden relative">
          <div className="px-6 py-4 border-b border-tertiary/10 bg-surface/40 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center h-16 shrink-0">
            <h2 className="font-heading text-lg font-semibold text-tertiary-foreground flex items-center gap-3">
              Transcript
              {!isSidebarOpen && (
                <Button className="h-8 px-3 text-xs" onClick={() => {
                  setSourceUrl(audioUrl ?? "");
                  setCurrentPodcast(podcast!);
                  play();
                }}>
                  <FaPlay className="mr-1.5 text-[10px]" /> Play Podcast
                </Button>
              )}
            </h2>

            {/* Expand Sidebar Button (Visible when collapsed on Desktop) */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="hidden md:block p-2 hover:bg-surface-highlight rounded-lg transition-colors text-tertiary"
                title="Show Details"
              >
                <FaEye className="text-lg" />
              </button>
            )}
          </div>

          {(data as unknown as number[])?.[1] === 404 ||
            (data?.conversations?.length === 0 && !isLoading) ? (
            <TranscriptMissing />
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center flex-grow">
              <Spinner size="xl" />
            </div>
          ) : error ? (
            <p className="text-rose-400 p-4">Error loading transcript: {error?.message}</p>
          ) : null}

          {data?.conversations && (
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar h-full">
              <Conversation
                podcastId={podcast?.id ?? ""}
                conversation={data?.conversations ?? []}
                questions={liveQuestions?.questions || []}
                refreshQuestions={() => refreshQuestions?.()}
              />
            </div>
          )}
        </div>

        {/* Sidebar - Right Side (Desktop) / Top (Mobile) */}
        <div className={cn(
          "bg-surface/40 backdrop-blur-xl border-l md:border-l-0 border-tertiary/20 rounded-3xl md:rounded-l-none flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative",
          // Desktop: Collapsible width
          "md:static md:h-full",
          isSidebarOpen ? "md:w-80 md:opacity-100" : "md:w-0 md:opacity-0 md:border-0",
          // Mobile: Always visible, auto height
          "w-full h-auto border-0 border-b md:border-b-0 mb-4 md:mb-0"
        )}>
          {/* Collapse Button (Desktop Only) */}
          <div className="absolute top-4 right-4 z-20 hidden md:block">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 bg-surface/50 hover:bg-surface text-tertiary hover:text-primary rounded-md transition-colors backdrop-blur-md"
              title="Hide Details"
            >
              <FaEyeSlash size={14} />
            </button>
          </div>

          <div className="p-4 md:p-5 space-y-5 overflow-y-auto h-full custom-scrollbar">
            <div className="flex flex-row md:flex-col gap-5 items-start">
              <img
                src={imageUrl ?? "/podcastplaceholdercover.png"}
                alt={podcast?.podcast_title}
                className="w-24 md:w-full aspect-square h-auto object-cover rounded-2xl shadow-lg ring-1 ring-white/10 flex-shrink-0"
              />
              <div className="space-y-2 min-w-0">
                <h2 className="font-heading text-xl md:text-2xl font-bold text-tertiary-foreground text-left leading-tight line-clamp-2 md:line-clamp-none">
                  {podcast?.podcast_title}
                </h2>
                <p className="text-tertiary text-sm text-left leading-relaxed line-clamp-3 md:line-clamp-none">{podcast?.podcast_description}</p>
              </div>
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

            <div className="flex flex-wrap gap-2 justify-start w-full">
              <Button isLoading={audioLoading} onClick={() => {
                if (isPlaying) {
                  pause();
                } else {
                  setSourceUrl(audioUrl ?? "");
                  setCurrentPodcast(podcast!);
                  play();
                }
              }} className="flex-1 md:flex-none w-full md:w-auto">
                {isPlaying ? <span className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Playing</span> : <><FaPlay className="inline mr-2" /> Play</>}
              </Button>

              <Button
                variant="secondary"
                isLoading={updateVisibilityLoading}
                onClick={() => {
                  const newStatus = !isPublic;
                  setIsPublic(newStatus);
                  mutate({
                    podcast_id: podcast?.id ?? "",
                    is_public: newStatus,
                  });
                }}
              >
                {isPublic ? (
                  <><FaEye className="inline mr-1" /> Public</>
                ) : (
                  <><FaEyeSlash className="inline mr-1" /> Private</>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-start">
              <Button variant="ghost" isLoading={likeLoading} onClick={() => {
                // Optimistic Update
                setLiked(!liked);
                if (!liked) setDisliked(false);

                likePodcast({
                  podcast_id: podcast?.id ?? "",
                  liked: !liked,
                });
              }}>
                {liked ? <FaThumbsUp className="text-primary text-lg" /> : <FaRegThumbsUp className="text-tertiary text-lg" />}
              </Button>

              <Button variant="ghost" isLoading={dislikeLoading} onClick={() => {
                // Optimistic Update
                setDisliked(!disliked);
                if (!disliked) setLiked(false);

                dislikePodcast({
                  podcast_id: podcast?.id ?? "",
                  disliked: !disliked,
                });
              }}>
                {disliked ? <FaThumbsDown className="text-primary text-lg" /> : <FaRegThumbsDown className="text-tertiary text-lg" />}
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
        </div>
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
