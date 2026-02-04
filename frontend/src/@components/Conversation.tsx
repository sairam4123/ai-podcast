import { Podcast } from "../@types/Podcast";
import { useGetAvatarImage } from "../api/getAvatarImage";
import { cn } from "../lib/cn";
import { removeSSMLtags } from "../utils/removeSSMLtags";
import { Conversation as ConversationType } from "../@types/Conversation";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import ReactMarkdown from "react-markdown";
import { FaMicrophone, FaPaperPlane, FaSpinner } from "react-icons/fa";
import { useRef, useState } from "react";
import useSendLiveQuestion from "../api/sendLiveQuestion";
import { ProfileAvatarIcon } from "./AvatarIcon";
import { RecordModal } from "../modals/Record";
import { useGetAudio } from "../api/getAudio";

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
    <div className="flex flex-col items-start justify-start w-full p-2 overflow-hidden">
      <div className="flex flex-col items-start justify-start w-full p-2 px-4 overflow-y-scroll mt-4 space-y-4">
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
        <div className="flex flex-row items-center text-gray-400 p-2">
          <FaSpinner className="animate-spin mr-2" />
          <span>Loading response audio...</span>
        </div>
      )}
      {error && (
        <div className="flex flex-row items-center text-red-400 p-2">
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
  // console.log(imageUrl)
  if (isCurrent)
    console.log(
      ((currentPosition - (conv.start_time ?? 0)) /
        ((conv.end_time ?? 0) - (conv.start_time ?? 0))) *
      100,
      conv.start_time,
      conv.end_time,
      currentPosition,
      isPlaying
    );

  return (
    <div
      id={id}
      className={`flex ${isHost
        ? `bg-gradient-to-tl from-cyan-600/70 to-cyan-800/90 ml-auto rounded-t-2xl rounded-l-2xl rounded-br-md`
        : `bg-gradient-to-tr from-cyan-900/80 to-cyan-950/90 rounded-t-2xl rounded-bl-md rounded-r-2xl`
        } text-white max-w-6/7 md:max-w-4/7 lg:max-w-3/7 transition-all ${currentPosition > (conv.start_time ?? 0) &&
          currentPosition < (conv.end_time ?? 0) &&
          isPlaying &&
          isCurrent
          ? "outline-1 outline-white scale-105"
          : ""
        } hover:drop-shadow-xl cursor-pointer hover:scale-[1.02] p-3`}
      onClick={() => {
        onClick();
      }}
    >
      <div className="flex flex-row items-start">
        {/* <FaSpinner className={cn("text-4xl text-gray-200", isLoading ? "animate-spin" : "hidden")} /> */}
        {imageUrl ? (
          <img
            className={cn(
              "h-5 w-5 md:h-6 md:w-6 mr-2 aspect-square rounded-full",
              isLoading && "hidden"
            )}
            src={imageUrl}
          />
        ) : (
          <ProfileAvatarIcon
            imageUrl={imageUrl}
            id={person.id}
            imageClassName="h-5 w-5 md:w-6 mr-2 aspect-square rounded-full"
            className="h-5 w-5 md:h-6 md:w-6 mr-2 rounded-full"
          />
        )}
        <div className="">
          <p className="text-sm md:text-base text-shadow-md font-bold text-gray-200">
            {person?.name}
          </p>
          <p className="relative text-xs md:text-sm z-10">
            <ReactMarkdown>{removeSSMLtags(conv.text)}</ReactMarkdown>

            {isCurrent && (
              <div
                className={`absolute transition-all ease-out duration-75 inset-0 w-full h-full bg-cyan-400/30 z-0`}
                style={{
                  width: `${((currentPosition - (conv.start_time ?? 0)) /
                    ((conv.end_time ?? 0) - (conv.start_time ?? 0))) *
                    100
                    }%`,
                }}
              />
            )}
          </p>
        </div>
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
    <div className="w-full flex flex-row justify-center items-center p-3 mt-4 text-center text-cyan-200 rounded-xl bg-cyan-950/60 border border-cyan-500/20">
      <RecordModal
        isVisible={recordingIsVisible}
        setIsVisible={setRecordingModalIsVisible}
        podcast_id={podcastId}
      />
      <input
        value={question}
        onChange={(e) => onChange?.(e.target.value)}
        type="text"
        className="flex grow p-2 bg-transparent border-none outline-none"
        placeholder="Ask a question..."
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (!question || question.trim() === "") return;
            sendLiveQuestion({ question: question, podcast_id: podcastId });
          }
        }}
      />
      <div className="text-xl gap-2 flex flex-row">
        <FaMicrophone
          onClick={() => {
            setRecordingModalIsVisible(true);
          }}
          className="text-xl cursor-pointer pr-2 hover:text-cyan-200 text-cyan-400/60"
        />
        {isMutationLoading ? (
          <div className="pr-2">
            <FaSpinner className="text-xl cursor-pointer animate-spin object-center origin-center text-cyan-400" />
          </div>
        ) : (
          <FaPaperPlane
            onClick={() => {
              if (!question || question.trim() === "") return;
              sendLiveQuestion({ question: question, podcast_id: podcastId });
            }}
            className="text-xl cursor-pointer pr-2 hover:text-cyan-200 text-cyan-400/60"
          />
        )}
      </div>
    </div>
  );
};
