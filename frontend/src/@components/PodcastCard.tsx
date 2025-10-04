// PodcastCardSkeleton.tsx
import { motion } from "framer-motion";
import clsx from "clsx";
import { FaPlay, FaPause, FaSpinner, FaCircle } from "react-icons/fa";
import { useNavigate } from "react-router";
import { Podcast } from "../@types/Podcast";
import { api } from "../api/api";
import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";
import { usePodcastContext } from "../contexts/podcast.context";
import { cn } from "../lib/cn";
import { getRelativeTime } from "../utils/getRelativeTime";
import { formatNumber } from "../utils/formatNumber";
import { formatDuration } from "../utils/formatDuration";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
};

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-slate-300/50",
        className,
        "rounded-md"
      )}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        style={{ ...shimmerStyle }}
      />
    </div>
  );
}

export default function PodcastCardSkeleton() {
  return (
    <div className="relative cursor-pointer z-1 w-48 h-64 border border-sky-800/20 transition-all ease-out shadow-md shadow-black/60 m-3 min-w-48 bg-sky-500/30 rounded-lg overflow-hidden select-none">
      {/* Image shimmer */}
      <ShimmerBlock className="w-full h-47 rounded-lg" />

      {/* Content shimmer */}
      <div className="absolute inset-0 flex flex-col justify-end p-2 gap-1 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-lg">
        <ShimmerBlock className="h-5 w-11/12" /> {/* Title */}
        <ShimmerBlock className="h-3 w-4/5" /> {/* Desc line 1 */}
        <div className="flex items-center gap-2 mt-1">
          <ShimmerBlock className="h-3 w-8 rounded-sm" />
          <ShimmerBlock className="h-3 w-16 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export function PodcastCard({ podcast }: { podcast?: Podcast }) {
  const navigate = useNavigate();

  const { setSourceUrl, isPlaying, pause, play } = useMediaPlayerContext({
    autoPlay: true,
  });
  const { imageUrl } = api.useGetImage({ podcastId: podcast?.id ?? "" });

  const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );

  const { currentPodcast, setCurrentPodcast } = usePodcastContext();

  const isCurrentPodcast = currentPodcast?.id === podcast?.id;

  //     const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // //     console.log("User's Time Zone:", currentTimeZone);

  // //     console.log("created_at from DB:", podcast?.created_at);
  // // console.log("Parsed Date:",  Date.parse(podcast?.created_at));
  // // console.log("Now:", new Date());

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        console.log("Clicked on podcast card", podcast?.id);
        setSourceUrl(audioUrl);
        setCurrentPodcast(podcast!);
        if (!isPlaying || !isCurrentPodcast) {
          play();
        }
      }}
      className="relative cursor-pointer z-1 active:scale-[0.98] select-none w-48 h-64 hover:brightness-110 group/card hover:scale-[1.03] border border-sky-900/20 transition-all ease-out shadow-md hover:shadow-black/80 shadow-black/60 m-3 min-w-48 bg-sky-950/50 rounded-lg"
    >
      <img
        src={imageUrl ?? "/podcastplaceholdercover.png"}
        alt="Podcast"
        className="flex group-hover/card:brightness-60 group-hover/card:blur-[1px] transition-all w-48 md:max-h-48 object-cover flex-grow object-center overflow-clip md:max-w-48 aspect-square h-auto md:w-auto mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97% rounded-lg"
      />

      <div
        className={cn(
          "absolute inset-0 group-hover/card:flex hidden",
          isCurrentPodcast && "flex"
        )}
      >
        <div
          onClick={() => {
            setSourceUrl(audioUrl);
            setCurrentPodcast(podcast!);
          }}
          className="flex items-center justify-center w-48 h-48"
        >
          <FaPlay
            onClick={(e) => {
              e.stopPropagation();
              if (!isPlaying || !isCurrentPodcast) {
                setSourceUrl(audioUrl);
                setCurrentPodcast(podcast!);
              }
              console.log("Playing podcast", podcast?.id, isCurrentPodcast);
              if (!isPlaying && isCurrentPodcast) {
                play();
              }
            }}
            className="text-6xl text-gray-200 opacity-75 active:scale-75 hover:opacity-100 hover:text-white ease-in-out duration-75 transition-all"
            style={{
              display:
                (audioLoading || isPlaying) && isCurrentPodcast
                  ? "none"
                  : "flex",
            }}
          />
          <FaPause
            onClick={(e) => {
              e.stopPropagation();
              pause();
            }}
            className="text-6xl text-gray-200 opacity-75 active:scale-75 hover:text-white ease-in-out duration-75 transition-opacity"
            style={{
              display:
                ((audioLoading || !isPlaying) && isCurrentPodcast) ||
                !isCurrentPodcast
                  ? "none"
                  : "flex",
            }}
          />
          <FaSpinner
            className="animate-spin text-6xl text-gray-200 opacity-75 hover:text-white ease-in-out duration-75 transition-opacity"
            style={{
              display: audioLoading ? "flex" : "none",
            }}
          />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2 gap-0.5 bg-linear-180 from-transparent to-black/50 from-60% rounded-lg ">
        <p
          onClick={() => {
            console.log("Clicked on podcast title", podcast?.id);
            navigate(`/podcast/${podcast?.id}`);
          }}
          className="text-lg group-hover/card:text-base transition-all pointer-events-auto font-bold line-clamp-1 hover:underline text-white"
        >
          {podcast?.podcast_title}
        </p>
        <p className="text-xs group-hover/card:text-[12px] -mt-1 transition-all text-gray-300 mask-r-from-80% line-clamp-2 mask-r-to-100% overflow-clip text-nowrap group-hover/card:mask-r-to-100% group-hover/card:mask-r-from-100% group-hover/card:text-wrap">
          {podcast?.podcast_description}
        </p>
        <p className="flex flex-row items-center gap-1.5 text-gray-200 text-xs">
          <span className="flex-row flex items-center gap-1">
            <FaPlay className="text-gray-200 text-[10px]" />{" "}
            {formatNumber(podcast?.view_count ?? 0)}
          </span>
          <FaCircle className="text-gray-200 text-[5px]" />
          <span>
            {getRelativeTime(podcast?.created_at ?? null)}
            {/* <TimeAgo date={getRelativeTime(podcast?.created_at)} /> */}
          </span>
        </p>
      </div>
    </div>
  );
}

export function HorizontalPodcastCard({ podcast }: { podcast: Podcast }) {
  const navigate = useNavigate();
  const { setSourceUrl, isPlaying, pause, play } = useMediaPlayerContext({
    autoPlay: true,
  });
  const { imageUrl } = api.useGetImage({ podcastId: podcast?.id ?? "" });
  const { audioUrl, isLoading: audioLoading } = api.useGetAudio(
    { podcast_id: podcast?.id ?? "" },
    { enabled: !!podcast?.id }
  );
  const { currentPodcast, setCurrentPodcast } = usePodcastContext();
  const isCurrentPodcast = currentPodcast?.id === podcast?.id;

  return (
    <div
      className="lg:h-32 h-38 w-full bg-linear-45 -from-30% from-sky-950 to-black to-130% via-50% via-sky-900/25 shadow-2xl border-sky-700 border shadow-black/30 hover:shadow-black/40 gap-2 rounded-lg hover:scale-102 transition-all ease-in-out hover:brightness-110 flex flex-row"
      onClick={(e) => {
        e.stopPropagation();
        console.log("Clicked on podcast card", podcast?.id);
        setSourceUrl(audioUrl);
        setCurrentPodcast(podcast!);

        if ((!isPlaying || !isCurrentPodcast) && !audioLoading) {
          play();
        } else if (isPlaying && isCurrentPodcast && !audioLoading) {
          pause();
        }
      }}
    >
      <div className="p-1">
        <img
          className={`${
            !imageUrl && "animate-pulse"
          } lg:h-30 h-24 min-w-24 lg:min-w-30 rounded-lg aspect-square mask-radial-from-91% mask-radial-fartest-side mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97%`}
          src={imageUrl ?? "/podcastplaceholdercover.png"}
        ></img>
      </div>
      <div>
        <div className="flex flex-col flex-grow">
          <div>
            <p className="text-lg font-bold text-gray-100">
              <a
                onClick={(e) => {
                  e.preventDefault();

                  // Navigate to the podcast page
                  navigate(`/podcast/${podcast?.id}`);
                }}
                href={`/podcast/${podcast?.id}`}
                className="hover:underline text-base hover:text-sky-50 line-clamp-1 transition-all cursor-pointer duration-150 ease-in-out"
              >
                {podcast?.podcast_title}
              </a>
            </p>
            <p className="cursor-default text-xs line-clamp-2 text-gray-300">
              {podcast?.podcast_description}
            </p>
            <p className="text-xs text-gray-400">
              {formatDuration(podcast?.duration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// function HorizontalPodcastCard({ task }: { task?: PodcastGenTask }) {
//   console.log("Rendering HorizontalPodcastCard with task:", task);

//   const [trackedTask, setTrackedTask] = useState<PodcastGenTask | null>(
//     task ?? null
//   );

//   useEffect(() => {
//     async function setupSupabaseRealtime() {
//       if (task?.status === "completed" || task?.status === "failed") {
//         console.log(
//           "Task is already completed or failed, no need to subscribe to realtime updates."
//         );
//         return;
//       }

//       await supabase.realtime.setAuth();

//       // supabase.channel(`topic:${task?.id}`, {
//       //     config: {
//       //         private: true,
//       //     }
//       // })

//       supabase
//         .channel(`topic:${task?.id}`, {
//           config: {
//             private: true,
//           },
//         })
//         .on("broadcast", { event: "update" }, (payload) => {
//           console.log("Received update for task:", payload);
//           if (
//             payload.payload.record.podcast_id !== trackedTask?.podcast?.id &&
//             payload.payload.record.podcast_id
//           ) {
//             console.log("Podcast metadata generated");
//             // fetch new podcast
//             supabase
//               .from("podcast")
//               .select("*")
//               .eq("id", payload.payload.record.podcast_id)
//               .single()
//               .then(({ data, error }) => {
//                 if (error) {
//                   console.error("Error fetching podcast data:", error);
//                   return;
//                 }
//                 const updatedTask = {
//                   ...payload.payload.record,
//                   podcast: data,
//                 } as PodcastGenTask;
//                 setTrackedTask(updatedTask);
//               });
//             return;
//           }
//           setTrackedTask((trackedTaskPrev) => ({
//             ...trackedTaskPrev,
//             ...payload.payload.record,
//           }));
//           // You can handle the update here, e.g., refetch data or update state
//         })
//         .subscribe((status) => {
//           if (status === "SUBSCRIBED") {
//             console.log("Subscribed to realtime updates for task:", task?.id);
//           } else {
//             console.error(
//               "Failed to subscribe to realtime updates for task:",
//               task?.id,
//               status
//             );
//           }
//         });
//     }
//     setupSupabaseRealtime();
//     return () => {
//       // Cleanup function to unsubscribe from the channel
//       supabase.channel(`topic:${task?.id}`).unsubscribe();
//     };
//   }, [task?.id, task?.status, trackedTask?.podcast?.id]);

//   const navigate = useNavigate();
//   const { imageUrl } = api.useGetImage({
//     podcastId: trackedTask?.podcast?.id ?? "",
//   });
//   return (
//     <div
//       className="lg:h-32 h-38 w-full bg-linear-45 -from-30% from-sky-950 to-black to-130% via-50% via-sky-900/25 shadow-2xl border-sky-700 border shadow-black/30 hover:shadow-black/40 gap-2 rounded-lg hover:scale-102 transition-all ease-in-out hover:brightness-110 flex flex-row"
//       tabIndex={0}
//     >
//       <div className="p-1">
//         <img
//           className={`${
//             !imageUrl && "animate-pulse"
//           } lg:h-30 h-24 min-w-24 lg:min-w-30 rounded-lg aspect-square mask-radial-from-91% mask-radial-fartest-side mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97%`}
//           src={imageUrl ?? "/podcastplaceholdercover.png"}
//         ></img>
//       </div>
//       <div>
//         <div className="flex flex-col flex-grow">
//           <div>
//             <p className="text-lg font-bold text-gray-100">
//               <a
//                 aria-disabled={
//                   trackedTask?.podcast_id === null ||
//                   trackedTask?.podcast_id === undefined
//                 }
//                 onClick={(e) => {
//                   e.preventDefault();
//                   if (
//                     trackedTask?.podcast_id === null ||
//                     trackedTask?.podcast_id === undefined
//                   ) {
//                     console.warn(
//                       "Podcast ID is not available, cannot navigate."
//                     );
//                     return;
//                   }
//                   // Navigate to the podcast page
//                   navigate(`/podcast/${trackedTask?.podcast_id}`);
//                 }}
//                 href={`/podcast/${trackedTask?.podcast_id}`}
//                 className="hover:underline text-base hover:text-sky-50 line-clamp-1 transition-all cursor-pointer duration-150 ease-in-out"
//               >
//                 {!trackedTask?.podcast?.title ? (
//                   <ShimmerBlock className="w-24 mt-1 h-4" />
//                 ) : (
//                   trackedTask?.podcast?.title
//                 )}
//               </a>
//             </p>
//             <p className="cursor-default text-xs line-clamp-2 text-gray-300">
//               {!trackedTask?.podcast?.description ? (
//                 <ShimmerBlock className="w-48 h-8 mt-1" />
//               ) : (
//                 trackedTask?.podcast?.description
//               )}
//             </p>
//             {/* <p className="text-xs text-gray-400">{formatDuration(currentPodcast?.duration)}</p> */}
//           </div>
//         </div>
//         <div className="flex flex-col gap-2 lg:flex-row mt-2 lg:items-center lg:justify-start items-start justify-center">
//           {/* <p className={`text-sm px-2 py-1 rounded-full bg-amber-900 text-gray-50 ${trackedTask?.status === "pending" ? "bg-amber-700 animate-pulse" : trackedTask?.status === "in_progress" ? "bg-blue-700" : trackedTask?.status === "completed" ? "bg-green-700" : trackedTask?.status === "failed" ? "bg-red-700" : "bg-gray-700"} transition-all duration-200`}>
//                 {trackedTask?.status === "pending"
//                 ? "Pending"
//                 : trackedTask?.status === "in_progress"
//                 ? "Processing"
//                 : trackedTask?.status === "completed"
//                 ? "Completed"
//                 : trackedTask?.status === "failed"
//                 ? "Failed"
//                 : "Unknown Status"}
//             </p> */}
//           {trackedTask?.status === "pending" ? (
//             <ShimmerBlock className="bg-transparent rounded-full">
//             <p className="text-xs lg:text-sm w-fit h-fit rounded-full bg-amber-700 px-2 py-1 text-gray-200">
//               Pending
//             </p>
//             </ShimmerBlock>
//           ) : trackedTask?.status === "in_progress" ? (
//             <p className="text-xs lg:text-sm rounded-full bg-blue-700 px-2 py-1 text-gray-200">
//               Processing
//             </p>
//           ) : trackedTask?.status === "completed" ? (
//             <p className="text-xs lg:text-sm rounded-full bg-green-700 px-2 py-1 text-gray-200">
//               Completed
//             </p>
//           ) : trackedTask?.status === "failed" ? (
//             <p className="text-xs lg:text-sm rounded-full bg-red-700 px-2 py-1 text-gray-200">
//               Failed
//             </p>
//           ) : (
//             <p className="text-xs lg:text-sm rounded-full bg-gray-700 px-2 py-1 text-gray-200">
//               Unknown Status
//             </p>
//           )}
//           {trackedTask?.status === "in_progress" && (
//             <p className="text-xs lg:text-sm rounded-full bg-blue-700 px-2 py-1 text-gray-200">
//               {trackedTask?.progress !== undefined
//                 ? `${trackedTask.progress}% - ${trackedTask?.progress_message}`
//                 : "No progress available"}
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
