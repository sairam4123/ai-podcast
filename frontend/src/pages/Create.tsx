import { PiSpinnerGap } from "react-icons/pi";
import { ActionModalActionRow } from "../@components/ActionModal";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { useEffect, useRef, useState } from "react";
import { PodcastGenTask } from "../@types/PodcastGenTask";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router";
import { ShimmerBlock } from "../@components/Shimmer";
import toast from "react-hot-toast";
import { CreatePodcastModal } from "../modals/CreatePodcast";
import { FaPlus } from "react-icons/fa";

export default function Create() {
  const { data: queueData, isLoading, error, refetch } = api.useGetQueue();
  console.log(
    "Queue data:",
    queueData,
    "isLoading:",
    isLoading,
    "error:",
    error
  );

  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);

  const createPodcastMutation = api.useGeneratePodcast({
    onSuccess: (data) => {
      console.log("Podcast created successfully:", data);
      refetch(); // Refetch the queue after successful creation
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const [description, setDescription] = useState("");

  return (
    <div className="flex flex-col min-h-screen lg:h-screen select-none bg-radial pb-32 from-sky-950 to-black">
      <NavBar />
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4 overflow-hidden">
        <div className="flex flex-col flex-1/3 overflow-y-auto bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
          <h1 className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
            Create a new podcast
          </h1>
          <form ref={formRef} className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-50">Topic</label>
            <input
              type="text"
              name="topic"
              required
              className="border text-white bg-black/50 placeholder:text-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g., AI in Healthcare, Space Exploration, etc."
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
              required={true}
              value={description}
              className="border text-white bg-black/50 placeholder:text-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="provide more details about the topic, target audience, etc."
              rows={3}
            ></textarea>
            <label className="text-sm font-semibold text-gray-50">Style</label>
            <input
              type="text"
              name="style"
              required
              className="border text-white bg-black/50 placeholder:text-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g., interview, solo, etc."
            />

            <label className="text-sm font-semibold text-gray-50">
              Language
            </label>
            <input
              type="text"
              name="language"
              required
              className="border text-white bg-black/50 placeholder:text-gray-100 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g., en-US, en-IN, ta-IN, etc."
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
              placeholder=""
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
                  Clear
                </button>,

                <button
                  type="button"
                  onClick={() => {
                    setIsAutoFillModalOpen(true);
                  }}
                  className="bg-sky-500 flex items-center text-white rounded-lg px-4 py-2 hover:bg-sky-600 transition-colors cursor-pointer"
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
                  Auto-Fill
                  </button>,

                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();

                    const form = e.currentTarget.closest(
                      "form"
                    ) as HTMLFormElement;
                    const formData = new FormData(form);

                    // validate the form data
                    if (
                      !formData.get("topic") ||
                      !formData.get("description") ||
                      !formData.get("style") ||
                      !formData.get("language")
                    ) {
                      console.error("All fields are required.");
                      toast.error("All fields are required.");
                      return;
                    }

                    const data = {
                      topic: formData.get("topic") as string,
                      description: formData.get("description") as string,
                      style: formData.get("style") as string,
                      language: formData.get("language") as string,
                    };
                    console.log("Creating podcast with data:", data);
                    createPodcastMutation.mutate(data);
                  }}
                  className="bg-sky-500 flex items-center text-white rounded-lg px-4 py-2 hover:bg-sky-600 transition-colors cursor-pointer"
                >
                  <div className="flex flex-row items-center justify-center gap-2">
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
                  <FaPlus className="text-lg" />
                  Create
                  </div>
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
      <CreatePodcastModal
        isOpen={isAutoFillModalOpen}
        onClose={() => setIsAutoFillModalOpen(false)}
        onCreate={(data) => {
          setIsAutoFillModalOpen(false);
          console.log("Creating podcast with auto-filled data:", data);
          // get the form 
          formRef.current?.reset(); // Reset the form fields
          setDescription(data.description); // Set the description state

          // TODO: Replace the manual input selection with React Hook Form -- Sairam July 2025

          (formRef.current!.elements.namedItem("topic") as HTMLInputElement)!.value =
            data.topic ?? ""; // Set the topic field
          
          (formRef.current!.elements.namedItem("style") as HTMLInputElement)!.value =
            data.style ?? ""; // Set the style field

          (formRef.current!.elements.namedItem("language") as HTMLInputElement)!.value =
            data.language ?? ""; // Set the language field

        }}
        />
    </div>
  );
}

function HorizontalPodcastCard({ task }: { task?: PodcastGenTask }) {
  console.log("Rendering HorizontalPodcastCard with task:", task);

  const [trackedTask, setTrackedTask] = useState<PodcastGenTask | null>(
    task ?? null
  );

  useEffect(() => {
    async function setupSupabaseRealtime() {
      if (task?.status === "completed" || task?.status === "failed") {
        console.log(
          "Task is already completed or failed, no need to subscribe to realtime updates."
        );
        return;
      }

      await supabase.realtime.setAuth();

      // supabase.channel(`topic:${task?.id}`, {
      //     config: {
      //         private: true,
      //     }
      // })

      supabase
        .channel(`topic:${task?.id}`, {
          config: {
            private: true,
          },
        })
        .on("broadcast", { event: "update" }, (payload) => {
          console.log("Received update for task:", payload);
          if (
            payload.payload.record.podcast_id !== trackedTask?.podcast?.id &&
            payload.payload.record.podcast_id
          ) {
            console.log("Podcast metadata generated");
            // fetch new podcast
            supabase
              .from("podcast")
              .select("*")
              .eq("id", payload.payload.record.podcast_id)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error("Error fetching podcast data:", error);
                  return;
                }
                const updatedTask = {
                  ...payload.payload.record,
                  podcast: data,
                } as PodcastGenTask;
                setTrackedTask(updatedTask);
              });
            return;
          }
          setTrackedTask((trackedTaskPrev) => ({
            ...trackedTaskPrev,
            ...payload.payload.record,
          }));
          // You can handle the update here, e.g., refetch data or update state
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Subscribed to realtime updates for task:", task?.id);
          } else {
            console.error(
              "Failed to subscribe to realtime updates for task:",
              task?.id,
              status
            );
          }
        });
    }
    setupSupabaseRealtime();
    return () => {
      // Cleanup function to unsubscribe from the channel
      supabase.channel(`topic:${task?.id}`).unsubscribe();
    };
  }, [task?.id, task?.status, trackedTask?.podcast?.id]);

  const navigate = useNavigate();
  const { imageUrl } = api.useGetImage({
    podcastId: trackedTask?.podcast?.id ?? "",
  });
  return (
    <div
      className="lg:h-32 h-38 w-full bg-linear-45 -from-30% from-sky-950 to-black to-130% via-50% via-sky-900/25 shadow-2xl border-sky-700 border shadow-black/30 hover:shadow-black/40 gap-2 rounded-lg hover:scale-102 transition-all ease-in-out hover:brightness-110 flex flex-row"
      tabIndex={0}
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
                aria-disabled={
                  trackedTask?.podcast_id === null ||
                  trackedTask?.podcast_id === undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  if (
                    trackedTask?.podcast_id === null ||
                    trackedTask?.podcast_id === undefined
                  ) {
                    console.warn(
                      "Podcast ID is not available, cannot navigate."
                    );
                    return;
                  }
                  // Navigate to the podcast page
                  navigate(`/podcast/${trackedTask?.podcast_id}`);
                }}
                href={`/podcast/${trackedTask?.podcast_id}`}
                className="hover:underline text-base hover:text-sky-50 line-clamp-1 transition-all cursor-pointer duration-150 ease-in-out"
              >
                {!trackedTask?.podcast?.title ? (
                  <ShimmerBlock className="w-24 mt-1 h-4" />
                ) : (
                  trackedTask?.podcast?.title
                )}
              </a>
            </p>
            <p className="cursor-default text-xs line-clamp-2 text-gray-300">
              {!trackedTask?.podcast?.description ? (
                <ShimmerBlock className="w-48 h-8 mt-1" />
              ) : (
                trackedTask?.podcast?.description
              )}
            </p>
            {/* <p className="text-xs text-gray-400">{formatDuration(currentPodcast?.duration)}</p> */}
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row mt-2 lg:items-center lg:justify-start items-start justify-center">
          {/* <p className={`text-sm px-2 py-1 rounded-full bg-amber-900 text-gray-50 ${trackedTask?.status === "pending" ? "bg-amber-700 animate-pulse" : trackedTask?.status === "in_progress" ? "bg-blue-700" : trackedTask?.status === "completed" ? "bg-green-700" : trackedTask?.status === "failed" ? "bg-red-700" : "bg-gray-700"} transition-all duration-200`}>
                {trackedTask?.status === "pending"
                ? "Pending"
                : trackedTask?.status === "in_progress"
                ? "Processing"
                : trackedTask?.status === "completed"
                ? "Completed"
                : trackedTask?.status === "failed"
                ? "Failed"
                : "Unknown Status"}
            </p> */}
          {trackedTask?.status === "pending" ? (
            <ShimmerBlock className="bg-transparent rounded-full">
            <p className="text-xs lg:text-sm w-fit h-fit rounded-full bg-amber-700 px-2 py-1 text-gray-200">
              Pending
            </p>
            </ShimmerBlock>
          ) : trackedTask?.status === "in_progress" ? (
            <p className="text-xs lg:text-sm rounded-full bg-blue-700 px-2 py-1 text-gray-200">
              Processing
            </p>
          ) : trackedTask?.status === "completed" ? (
            <p className="text-xs lg:text-sm rounded-full bg-green-700 px-2 py-1 text-gray-200">
              Completed
            </p>
          ) : trackedTask?.status === "failed" ? (
            <p className="text-xs lg:text-sm rounded-full bg-red-700 px-2 py-1 text-gray-200">
              Failed
            </p>
          ) : (
            <p className="text-xs lg:text-sm rounded-full bg-gray-700 px-2 py-1 text-gray-200">
              Unknown Status
            </p>
          )}
          {trackedTask?.status === "in_progress" && (
            <p className="text-xs lg:text-sm rounded-full bg-blue-700 px-2 py-1 text-gray-200">
              {trackedTask?.progress !== undefined
                ? `${trackedTask.progress}% - ${trackedTask?.progress_message}`
                : "No progress available"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
