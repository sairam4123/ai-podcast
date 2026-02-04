import { PiSpinnerGap } from "react-icons/pi";
import { ActionModalActionRow } from "../@components/ActionModal";
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

  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);

  const createPodcastMutation = api.useGeneratePodcast({
    onSuccess: (data) => {
      console.log("Podcast created successfully:", data);
      refetch();
    },
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [description, setDescription] = useState("");

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Form Panel */}
      <div className="flex flex-col lg:w-96 glass-panel p-6 space-y-4">
        <h1 className="font-heading text-2xl font-bold text-white">
          Create a new podcast
        </h1>
        <form ref={formRef} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-1">
              Topic
            </label>
            <input
              type="text"
              name="topic"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 transition-colors"
              placeholder="e.g., AI in Healthcare, Space Exploration"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-1">
              Description
            </label>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              required
              value={description}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 transition-colors resize-none"
              placeholder="Provide details about the topic, target audience..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Style
            </label>
            <input
              type="text"
              name="style"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 transition-colors"
              placeholder="e.g., interview, solo, debate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Language
            </label>
            <input
              type="text"
              name="language"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 transition-colors"
              placeholder="e.g., en-US, en-IN, ta-IN"
            />
          </div>

          <input
            name="description"
            type="hidden"
            value={description}
          />

          <ActionModalActionRow
            buttons={[
              <button
                type="button"
                onClick={() => {
                  setDescription("");
                  formRef.current?.reset();
                }}
                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Clear
              </button>,
              <button
                type="button"
                onClick={() => setIsAutoFillModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors cursor-pointer"
              >
                Auto-Fill
              </button>,
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget.closest("form") as HTMLFormElement;
                  const formData = new FormData(form);

                  if (
                    !formData.get("topic") ||
                    !formData.get("description") ||
                    !formData.get("style") ||
                    !formData.get("language")
                  ) {
                    toast.error("All fields are required.");
                    return;
                  }

                  const data = {
                    topic: formData.get("topic") as string,
                    description: formData.get("description") as string,
                    style: formData.get("style") as string,
                    language: formData.get("language") as string,
                  };
                  createPodcastMutation.mutate(data);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium transition-all cursor-pointer"
              >
                <div
                  className="transition-all duration-300 overflow-hidden"
                  style={{
                    width: createPodcastMutation.isLoading ? "1.25rem" : "0px",
                    height: createPodcastMutation.isLoading ? "1.25rem" : "0px",
                    marginRight: createPodcastMutation.isLoading ? "0.5rem" : "0px",
                  }}
                >
                  <PiSpinnerGap className="animate-spin text-xl" />
                </div>
                <FaPlus className="text-sm" />
                Create
              </button>,
            ]}
          />
        </form>
      </div>

      {/* Queue Panel */}
      <div className="flex flex-col flex-1 lg:flex-[0.6] glass-panel p-4 overflow-hidden">
        <h2 className="font-heading text-xl font-semibold text-white mb-3">
          Your Podcasts
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <PiSpinnerGap className="animate-spin text-4xl text-slate-400" />
            </div>
          ) : queueData?.tasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No podcasts in the queue.
            </p>
          ) : (
            queueData?.tasks.map((task: PodcastGenTask) => (
              <HorizontalPodcastCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
      <CreatePodcastModal
        isOpen={isAutoFillModalOpen}
        onClose={() => setIsAutoFillModalOpen(false)}
        onCreate={(data) => {
          setIsAutoFillModalOpen(false);
          formRef.current?.reset();
          setDescription(data.description);
          (formRef.current!.elements.namedItem("topic") as HTMLInputElement)!.value = data.topic ?? "";
          (formRef.current!.elements.namedItem("style") as HTMLInputElement)!.value = data.style ?? "";
          (formRef.current!.elements.namedItem("language") as HTMLInputElement)!.value = data.language ?? "";
        }}
      />
    </div>
  );
}

function HorizontalPodcastCard({ task }: { task?: PodcastGenTask }) {
  const [trackedTask, setTrackedTask] = useState<PodcastGenTask | null>(task ?? null);

  useEffect(() => {
    async function setupSupabaseRealtime() {
      if (task?.status === "completed" || task?.status === "failed") return;

      await supabase.realtime.setAuth();

      supabase
        .channel(`topic:${task?.id}`, { config: { private: true } })
        .on("broadcast", { event: "update" }, (payload) => {
          if (
            payload.payload.record.podcast_id !== trackedTask?.podcast?.id &&
            payload.payload.record.podcast_id
          ) {
            supabase
              .from("podcast")
              .select("*")
              .eq("id", payload.payload.record.podcast_id)
              .single()
              .then(({ data, error }) => {
                if (error) return;
                setTrackedTask({ ...payload.payload.record, podcast: data } as PodcastGenTask);
              });
            return;
          }
          setTrackedTask((prev) => ({ ...prev, ...payload.payload.record }));
        })
        .subscribe();
    }
    setupSupabaseRealtime();
    return () => {
      supabase.channel(`topic:${task?.id}`).unsubscribe();
    };
  }, [task?.id, task?.status, trackedTask?.podcast?.id]);

  const navigate = useNavigate();
  const { imageUrl } = api.useGetImage({ podcastId: trackedTask?.podcast?.id ?? "" });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-600/80",
    in_progress: "bg-blue-600/80",
    completed: "bg-green-600/80",
    failed: "bg-red-600/80",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    in_progress: "Processing",
    completed: "Completed",
    failed: "Failed",
  };

  return (
    <div className="flex gap-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 transition-colors">
      <img
        className={`h-20 w-20 rounded-lg object-cover flex-shrink-0 ${!imageUrl && "animate-pulse bg-slate-800"}`}
        src={imageUrl ?? "/podcastplaceholdercover.png"}
        alt=""
      />
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <a
          onClick={(e) => {
            e.preventDefault();
            if (!trackedTask?.podcast_id) return;
            navigate(`/podcast/${trackedTask?.podcast_id}`);
          }}
          href={`/podcast/${trackedTask?.podcast_id}`}
          className="font-heading font-semibold text-white text-sm line-clamp-1 hover:underline"
        >
          {!trackedTask?.podcast?.title ? (
            <ShimmerBlock className="w-32 h-4" />
          ) : (
            trackedTask?.podcast?.title
          )}
        </a>
        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
          {!trackedTask?.podcast?.description ? (
            <ShimmerBlock className="w-48 h-6 mt-1" />
          ) : (
            trackedTask?.podcast?.description
          )}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[trackedTask?.status ?? ""] ?? "bg-slate-600"}`}>
            {statusLabels[trackedTask?.status ?? ""] ?? "Unknown"}
          </span>
          {trackedTask?.status === "in_progress" && trackedTask?.progress !== undefined && (
            <span className="text-xs text-slate-400">
              {trackedTask.progress}% - {trackedTask?.progress_message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
