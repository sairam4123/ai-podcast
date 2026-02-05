import { Podcast } from "../@types/Podcast";
import { useGetAvatarImage } from "../api/getAvatarImage";
import { cn } from "../lib/cn";
import { removeSSMLtags } from "../utils/removeSSMLtags";
import { Conversation as ConversationType } from "../@types/Conversation";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import { useRef, useState } from "react";
import { FaMicrophone, FaPaperPlane, FaSpinner } from "react-icons/fa";
import useSendLiveQuestion from "../api/sendLiveQuestion";
import { ProfileAvatarIcon } from "./AvatarIcon";
import { RecordModal } from "../modals/Record";
import { useGetAudio } from "../api/getAudio";
import { Markdown } from "./Markdown";

export function Conversation({
  podcastId,
  conversation,
  questions,
  refreshQuestions,
}: {
  podcastId: Podcast["id"];
  conversation: ConversationType[];
  questions: {
    id: string;
    question: string;
    answer?: string;
    user?: { id: string; name: string };
    persona?: { id: string; name: string };
  }[];
  refreshQuestions?: () => void;
}) {
  const { isPlaying, currentPosition, play, seek } = useMediaPlayerContext();
  const { currentPodcast } = usePodcastContext();

  // const { audioUrl,  } = useGetAudio()

  const [currentQuestion, setCurrentQuestion] = useState("");

  const isCurrentPodcast = currentPodcast?.id === podcastId;
  console.log({ questions });

  return (
    <div className="flex flex-col items-start justify-start w-full p-2 overflow-hidden h-full">
      <div className="flex flex-col items-start justify-start w-full p-2 px-4 overflow-y-auto mt-4 space-y-6 scrollbar-thin scrollbar-track-surface scrollbar-thumb-tertiary">
        {conversation?.map((conv, index) => {
          const currentSpeaker = conv.speaker;
          const isCurrent =
            currentPosition > (conv.start_time ?? 0) &&
            currentPosition < (conv.end_time ?? 0) &&
            isPlaying &&
            isCurrentPodcast;
          if (isCurrent) {
            // focus the element (good idea?)
            setTimeout(() => {
              const element = document.getElementById(`conversation-${index}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 0);
          }
          return (
            <MessageCard
              onClick={() => {
                if (isCurrentPodcast) {
                  seek(conv.start_time);
                  play(); // just in case it's paused
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
          );
        })}

        {questions?.map((q) => (
          <>
            <MessageCard
              id={`question-${q.id}`}
              currentPosition={0}
              isPlaying={false}
              onClick={() => { }}
              key={`question-${q.id}`}
              podcastId={podcastId}
              person={{
                id: q.user?.id ?? "user-" + q.id,
                name: q.user?.name || "User",
              }}
              message={{
                id: q.id,
                text: q.question,
                episode_id: podcastId,
                start_time: 0,
                end_time: 0,
                speaker_id: "",
                speaker: {
                  id: q.id,
                  name: q.user?.name || "User",
                },
                podcast_author: {
                  is_host: true,
                  podcast_id: podcastId,
                  author_id: "user-" + q.id,
                },
              }}
              isCurrent={false}
              isHost={true}
            />

            {q.answer && <ResponseCard podcastId={podcastId} q={q} />}
          </>
        ))}
      </div>
      <QuestionBox
        question={currentQuestion}
        onChange={setCurrentQuestion}
        podcastId={podcastId}
        refreshQuestions={refreshQuestions}
      />
    </div>
  );
}

const ResponseCard = ({
  podcastId,
  q,
}: {
  podcastId: Podcast["id"];
  q: {
    id: string;
    question: string;
    answer?: string;
    user?: { id: string; name: string };
    persona?: { id: string; name: string };
  };
}) => {
  console.log("Rendering ResponseCard for question ID:", q.id);
  const { audioUrl, isLoading, error } = useGetAudio(
    {
      podcast_id: podcastId,
      resp_id: q.id,
    },
    {
      enabled: true,
    }
  );
  console.log("Response audioUrl:", audioUrl);
  const ref = useRef<HTMLAudioElement | null>(null);

  console.log(audioUrl);
  return (
    <>
      {isLoading && (
        <div className="flex flex-row items-center text-primary p-2 text-sm">
          <FaSpinner className="animate-spin mr-2" />
          <span>Loading response audio...</span>
        </div>
      )}
      {error && (
        <div className="flex flex-row items-center text-rose-400 p-2 text-sm">
          <span>Error loading response audio: {error.message}</span>
        </div>
      )}
      <MessageCard
        id={`response-${q.id}`}
        currentPosition={0}
        isPlaying={false}
        onClick={() => {
          if (ref) {
            ref.current?.play();
          }
        }}
        key={`response-${q.id}`}
        podcastId={podcastId}
        person={{
          id: q.persona?.id ?? "host-" + q.id,
          name: q.persona?.name || "Host",
        }}
        message={{
          id: q.id,
          text: q.answer ?? "N/A",
          episode_id: podcastId,
          start_time: 0,
          end_time: 0,
          speaker_id: "",
          speaker: {
            id: "host-" + q.id,
            name: q.persona?.name || "Host",
          },
          podcast_author: {
            is_host: true,
            podcast_id: podcastId,
            author_id: "host-" + q.id,
          },
        }}
        isCurrent={ref.current?.paused === false}
      />
      <audio src={audioUrl ?? ""} autoPlay={false} hidden ref={ref} />
    </>
  );
};

const MessageCard = ({
  message: conv,
  person,
  isCurrent,
  onClick,
  currentPosition,
  isPlaying,
  id,
  isHost,
}: {
  message: ConversationType;
  podcastId: Podcast["id"];
  person: NonNullable<ConversationType["speaker"]>;
  isCurrent: boolean;
  currentPosition: number;
  isPlaying: boolean;
  id: string;
  onClick: () => void;
  isHost?: boolean;
}) => {
  const { imageUrl, isLoading } = useGetAvatarImage({ personId: person.id });

  const cleanText = removeSSMLtags(conv.text);
  const startTime = conv.start_time ?? 0;
  const endTime = conv.end_time ?? 0;
  const duration = endTime - startTime;

  // Only enable highlighting if we have a valid duration and it's the current podcast
  const highlighting = duration > 0 ? {
    startTime,
    endTime,
    currentPosition,
    isPlaying,
    isCurrent,
  } : undefined;

  return (
    <div
      id={id}
      className={cn(
        "flex max-w-[90%] md:max-w-[80%] transition-all duration-500 ease-out group",
        isHost ? "ml-auto flex-row-reverse" : "mr-auto",
        currentPosition > startTime && currentPosition < endTime && isPlaying && isCurrent
          ? "scale-[1.01]"
          : "hover:scale-[1.005] opacity-80 hover:opacity-100"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className={cn("flex-shrink-0 mt-auto mb-2", isHost ? "ml-4" : "mr-4")}>
        {imageUrl ? (
          <img
            className={cn(
              "h-10 w-10 object-cover rounded-full shadow-sm ring-2 ring-white/5",
              isLoading && "hidden"
            )}
            src={imageUrl}
          />
        ) : (
          <ProfileAvatarIcon
            imageUrl={imageUrl}
            id={person.id}
            imageClassName="h-10 w-10 object-cover rounded-full"
            className="h-10 w-10 flex-shrink-0"
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative p-5 md:p-6 rounded-3xl shadow-sm border transition-all duration-300",
          isHost
            ? "bg-secondary/60 border-primary/20 text-secondary-foreground rounded-br-lg"
            : "bg-surface/60 border-tertiary/20 text-tertiary-foreground rounded-bl-lg",
          isCurrent
            ? "shadow-md ring-1 ring-white/10 bg-opacity-80 backdrop-blur-md"
            : "backdrop-blur-sm"
        )}
      >
        <p className={cn(
          "text-xs font-semibold mb-2 opacity-80 tracking-wide uppercase",
          isHost ? "text-right text-primary" : "text-left text-tertiary"
        )}>
          {person?.name}
        </p>

        <Markdown
          content={cleanText}
          highlighting={highlighting}
          className="text-[15px] leading-7 font-light tracking-wide text-pretty"
        />
      </div>
    </div>
  );
};

const QuestionBox = ({
  question = "",
  onChange,
  podcastId,
  refreshQuestions,
}: {
  question?: string;
  onChange?: (value: string) => void;
  podcastId: string;
  refreshQuestions?: () => void;
}) => {
  const { mutate: sendLiveQuestion, isLoading: isMutationLoading } =
    useSendLiveQuestion({
      onSuccess(data) {
        console.log("Question sent successfully:", data);
        onChange?.("");
        refreshQuestions?.();
      },
      onError(error) {
        console.error("Error sending question:", error);
      },
    });

  const [recordingIsVisible, setRecordingModalIsVisible] = useState(false);

  return (
    <div className="w-full flex flex-row justify-center items-center p-2 mt-4 text-center text-tertiary-foreground rounded-2xl bg-surface/60 border border-tertiary/30 shadow-inner">
      <RecordModal
        isVisible={recordingIsVisible}
        setIsVisible={setRecordingModalIsVisible}
        podcast_id={podcastId}
      />
      <input
        value={question}
        onChange={(e) => onChange?.(e.target.value)}
        type="text"
        className="flex grow p-3 bg-transparent border-none outline-none placeholder:text-tertiary"
        placeholder="Ask a question..."
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (!question || question.trim() === "") return;
            sendLiveQuestion({ question: question, podcast_id: podcastId });
          }
        }}
      />
      <div className="text-xl gap-3 flex flex-row px-2">
        <FaMicrophone
          onClick={() => {
            setRecordingModalIsVisible(true);
          }}
          className="text-lg cursor-pointer hover:text-primary text-tertiary transition-colors"
        />
        {isMutationLoading ? (
          <div className="">
            <FaSpinner className="text-lg cursor-pointer animate-spin object-center origin-center text-primary" />
          </div>
        ) : (
          <FaPaperPlane
            onClick={() => {
              if (!question || question.trim() === "") return;
              sendLiveQuestion({ question: question, podcast_id: podcastId });
            }}
            className="text-lg cursor-pointer hover:text-primary text-tertiary transition-colors"
          />
        )}
      </div>
    </div>
  );
};
