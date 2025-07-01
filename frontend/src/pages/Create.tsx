import { PiSpinnerGap } from "react-icons/pi";
import { ActionModalActionRow } from "../@components/ActionModal";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { useEffect, useState } from "react";
import { PodcastGenTask } from "../@types/PodcastGenTask";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router";
import { ShimmerBlock } from "../@components/Shimmer";

export default function Create() {
    
    const {data: queueData, isLoading, error, refetch} = api.useGetQueue();
    console.log("Queue data:", queueData, "isLoading:", isLoading, "error:", error);
    const createPodcastMutation = api.useGeneratePodcast({
      onSuccess: (data) => {
        console.log("Podcast created successfully:", data);
        refetch(); // Refetch the queue after successful creation
      },
    });

  const [description, setDescription] = useState("");

  return (
    <div className="flex flex-col min-h-screen lg:h-screen select-none bg-radial pb-32 from-sky-700 to-blue-900">
      <NavBar />
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4 overflow-hidden">
        <div className="flex flex-col flex-1/3 overflow-y-auto bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
          <h1 className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
            Create a new podcast
          </h1>
          <form className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-50">Topic</label>
            <input
              type="text"
              name="topic"
              className="border bg-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter podcast topic"
            />
            <label className="text-sm font-semibold text-gray-50">
              Description
            </label>
            <textarea
              autoComplete="description"
              onChange={(e) => {
                console.log("Description input changed:", e.target.value);
                setDescription(e.target.value);
              }}
              value={description}
              className="border bg-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter podcast description"
              rows={3}
            ></textarea>
            <label className="text-sm font-semibold text-gray-50">Style</label>
            <input
              type="text"
              name="style"
              className="border bg-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter podcast style (e.g., interview, solo, etc.)"
            />

            <label className="text-sm font-semibold text-gray-50">
              Language
            </label>
            <input
              type="text"
              name="language"
              className="border bg-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter podcast language"
            />
            <input
              name="description"
              type="text"
              onChange={(e) => {
                console.log("Description input changed:", e.target.value);
                setDescription(e.target.value);
              }}
              value={description}
              className="bg-gray-100 rounded-lg focus:outline-none h-0 opacity-0 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter podcast description"
            />

            <ActionModalActionRow
              buttons={[
                <button
                  type="button"
                  onClick={() => {
                    console.log("Clear form action triggered");
                    setDescription(""); // Reset description state
                    const form = document.querySelector(
                      "form"
                    ) as HTMLFormElement;
                    if (form) {
                      form.reset(); // Reset the form fields
                    }
                    // Handle cancel action here, e.g., reset form or close modal
                  }}
                  className="bg-gray-300 text-gray-800 rounded-lg px-4 py-2 hover:bg-gray-400 transition-colors cursor-pointer"
                >
                  {" "}
                  Clear Form
                </button>,
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget.closest(
                      "form"
                    ) as HTMLFormElement;
                    const formData = new FormData(form);
                    const data = {
                      topic: formData.get("topic") as string,
                      description: formData.get("description") as string,
                      style: formData.get("style") as string,
                      language: formData.get("language") as string,
                    };
                    console.log("Creating podcast with data:", data);
                    createPodcastMutation.mutate(data);
                    
                  }}
                  className="bg-blue-500 flex items-center text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <div
                    className="transition-all duration-300 overflow-hidden"
                    style={{
                      width: createPodcastMutation.isLoading
                        ? "1.25rem"
                        : "0px", // 1.25rem = 20px
                      height: createPodcastMutation.isLoading
                        ? "1.25rem"
                        : "0px",
                      marginRight: createPodcastMutation.isLoading
                        ? "0.5rem"
                        : "0px",
                    }}
                  >
                    <PiSpinnerGap className="animate-spin text-xl" />
                  </div>
                  Create Podcast
                </button>,
              ]}
            />
          </form>
        </div>
        <div className="flex flex-col flex-2/3 bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg overflow-hidden">
          <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
            Podcasts
          </p>

          <div className="flex-1 overflow-y-auto w-full">
            <div className="flex flex-col gap-2 px-4 py-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                    <PiSpinnerGap className="animate-spin text-4xl text-gray-200" />
                    </div>
                ) : queueData?.tasks.length === 0 ? (
                    <p className="text-gray-400 text-center">
                    No podcasts in the queue.
                    </p>
                ) : (
                    queueData?.tasks.map((task: PodcastGenTask) => (
                    <HorizontalPodcastCard key={task.id} task={task} />
                    ))
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HorizontalPodcastCard({ task }: { task?: PodcastGenTask }) {
  console.log("Rendering HorizontalPodcastCard with task:", task);

  const [trackedTask, setTrackedTask] = useState<PodcastGenTask | null>(task ?? null);

  
  useEffect(() => {
      async function setupSupabaseRealtime() {

        if (task?.status === "completed" || task?.status === "failed") {
            console.log("Task is already completed or failed, no need to subscribe to realtime updates.");
            return;
        }

          await supabase.realtime.setAuth();

        // supabase.channel(`topic:${task?.id}`, {
        //     config: {
        //         private: true,
        //     }
        // })

          supabase.channel(`topic:${task?.id}`, {
            config: {
                private: true,
            }
        }).on("broadcast", { event: "update" }, (payload) => {
            console.log("Received update for task:", payload);
            if (payload.payload.record.podcast_id !== trackedTask?.podcast?.id && payload.payload.record.podcast_id) {
                console.log("Podcast metadata generated")
                // fetch new podcast
                supabase.from("podcast").select("*").eq("id", payload.payload.record.podcast_id).single().then(({data, error}) => {
                    if (error) {
                        console.error("Error fetching podcast data:", error);
                        return;
                    }
                    const updatedTask = {
                        ...payload.payload.record,
                        podcast: data,
                    } as PodcastGenTask;
                    setTrackedTask(updatedTask);
                })
                return;
            }
            setTrackedTask(trackedTaskPrev => ({
                ...trackedTaskPrev,
                ...payload.payload.record,
            }))
            // You can handle the update here, e.g., refetch data or update state
        }).subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("Subscribed to realtime updates for task:", task?.id);
            } else {
                console.error("Failed to subscribe to realtime updates for task:", task?.id, status);
            }
        })
        
    }
    setupSupabaseRealtime();
    return () => {
        // Cleanup function to unsubscribe from the channel
        supabase.channel(`topic:${task?.id}`).unsubscribe();
    }
}, [task?.id, task?.status, trackedTask?.podcast?.id]);

const navigate = useNavigate();
const {imageUrl} = api.useGetImage({
  podcastId: trackedTask?.podcast?.id ?? "",
})
return (
    <div
    className="lg:h-32 h-38 w-full bg-linear-60 from-25% from-sky-700 to-sky-500 shadow-2xl border-sky-700 border shadow-black/30 hover:shadow-black/40 gap-2 rounded-lg hover:scale-102 transition-all ease-in-out hover:brightness-110 flex flex-row"
    tabIndex={0}
    >
      <div className="p-1">
        <img
          className={`${!imageUrl && "animate-pulse"} lg:h-30 h-24 min-w-24 lg:min-w-30 rounded-lg aspect-square mask-radial-from-91% mask-radial-fartest-side mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97%`}
          src={
            imageUrl ??
            "/podcastplaceholdercover.png"
          }
        ></img>
      </div>
      <div>
        <div className="flex flex-col flex-grow">
          <div>
            <p className="text-lg font-bold text-gray-100">
              <a
              aria-disabled={trackedTask?.podcast_id === null || trackedTask?.podcast_id === undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (trackedTask?.podcast_id === null || trackedTask?.podcast_id === undefined) {
                    console.warn("Podcast ID is not available, cannot navigate.");
                    return;
                  }
                  // Navigate to the podcast page
                    navigate(`/podcast/${trackedTask?.podcast_id}`);
                }}
                href={`/podcast/${trackedTask?.podcast_id}`}
                className="hover:underline text-base hover:text-sky-50 line-clamp-1 transition-all cursor-pointer duration-150 ease-in-out"
              >
                {!trackedTask?.podcast?.title ? <ShimmerBlock className="w-24 mt-1 h-4" /> : trackedTask?.podcast?.title}
              </a>
            </p>
            <p className="cursor-default text-xs line-clamp-2 text-gray-300">
              {!trackedTask?.podcast?.description ? <ShimmerBlock className="w-48 h-8 mt-1" /> : trackedTask?.podcast?.description}
            </p>
            {/* <p className="text-xs text-gray-400">{formatDuration(currentPodcast?.duration)}</p> */}
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row mt-2 items-center justify-start">
            <p className={`text-sm px-2 py-1 rounded-full bg-amber-900 text-gray-50 ${trackedTask?.status === "pending" ? "bg-amber-700 animate-pulse" : trackedTask?.status === "in_progress" ? "bg-blue-700" : trackedTask?.status === "completed" ? "bg-green-700" : trackedTask?.status === "failed" ? "bg-red-700" : "bg-gray-700"} transition-all duration-200`}>
                {trackedTask?.status === "pending"
                ? "Pending"
                : trackedTask?.status === "in_progress"
                ? "Processing"
                : trackedTask?.status === "completed"
                ? "Completed"
                : trackedTask?.status === "failed"
                ? "Failed"
                : "Unknown Status"}
            </p>
            {trackedTask?.status === "in_progress" && <p className="text-sm rounded-full bg-blue-700 px-2 py-1 text-gray-200">
                {trackedTask?.progress !== undefined
                ? `${trackedTask.progress}% - ${trackedTask?.progress_message}`
                : "No progress available"}
            </p>
            }
        </div>
      </div>
    </div>
  );
}
