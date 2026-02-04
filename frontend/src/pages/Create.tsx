import { PiSpinnerGap } from "react-icons/pi";
import { ActionModalActionRow } from "../@components/ActionModal";
import { Input } from "../@components/Input";
import { TextArea } from "../@components/TextArea";
import { api } from "../api/api";
import Spinner from "../@components/Spinner";
import { useEffect, useRef, useState } from "react";
import { PodcastGenTask } from "../@types/PodcastGenTask";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { CreatePodcastModal } from "../modals/CreatePodcast";
import { FaPlus, FaPlay, FaCheckCircle, FaExclamationCircle, FaClock } from "react-icons/fa";
import { cn } from "../lib/cn";

export default function Create() {
  const { data: queueData, isLoading, error, refetch } = api.useGetQueue();

  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);

  const createPodcastMutation = api.useGeneratePodcast({
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        if ("emsg" in data[0]) {
          toast.error(data[0].emsg as string);
          return;
        }
      }
      console.log("Podcast created successfully:", data);
      refetch();
    },
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [description, setDescription] = useState("");

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-[1800px] mx-auto w-full h-[calc(100vh-6rem)] overflow-hidden">
      {/* Form Panel */}
      <div className="flex flex-col lg:w-96 glass-panel p-6 space-y-6 bg-surface/40 border-tertiary/20 flex-shrink-0 h-full overflow-y-auto custom-scrollbar">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tertiary-foreground leading-tight">
            Create a new podcast
          </h1>
          <p className="text-tertiary text-sm mt-1">
            Fill in the details below to generate your AI podcast.
          </p>
        </div>

        <form ref={formRef} className="flex flex-col gap-5">
          <Input
            label="Topic"
            name="topic"
            required
            placeholder="e.g., AI in Healthcare, Space Exploration"
          />

          <TextArea
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about the topic, target audience..."
            rows={4}
          />

          <Input
            label="Style"
            name="style"
            required
            placeholder="e.g., interview, solo, debate"
          />

          <Input
            label="Language"
            name="language"
            required
            placeholder="e.g., en-US, en-IN, ta-IN"
          />

          <input
            name="description"
            type="hidden"
            value={description}
          />

          <ActionModalActionRow
            className="pt-2 border-0 mt-2"
            buttons={[
              <button
                type="button"
                onClick={() => {
                  setDescription("");
                  formRef.current?.reset();
                }}
                className="px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-highlight text-tertiary hover:text-tertiary-foreground font-medium transition-colors cursor-pointer text-sm border border-tertiary/10"
              >
                Clear
              </button>,
              <button
                type="button"
                onClick={() => setIsAutoFillModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-highlight text-tertiary-foreground font-medium transition-colors cursor-pointer text-sm border border-tertiary/10"
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-lg shadow-primary/20"
                disabled={createPodcastMutation.isLoading}
              >
                {createPodcastMutation.isLoading && <Spinner size="sm" color="white" />}
                {!createPodcastMutation.isLoading && <FaPlus className="text-xs" />}
                Create
              </button>,
            ]}
          />
        </form>
      </div>

      {/* Queue Panel - Suno Inspired List */}
      <div className="flex flex-col flex-1 glass-panel p-0 overflow-hidden bg-surface/30 border-tertiary/20">
        <div className="p-6 border-b border-tertiary/10 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-xl font-semibold text-tertiary-foreground">
              Your Podcasts
            </h2>
            <div className="flex gap-2">
              <span className="text-xs font-medium text-tertiary px-2 py-1 rounded bg-surface border border-tertiary/10">
                {queueData?.tasks.length} Podcasts
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <PiSpinnerGap className="animate-spin text-4xl text-primary" />
            </div>
          ) : queueData?.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <img src="/podcastplaceholdercover.png" className="w-24 h-24 rounded-2xl mb-4 grayscale opacity-50" />
              <p className="text-tertiary text-center">
                No podcasts yet. Start creating!
              </p>
            </div>
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
    </div >
  );
}

function HorizontalPodcastCard({ task }: { task?: PodcastGenTask }) {
  const [trackedTask, setTrackedTask] = useState<PodcastGenTask | null>(task ?? null);
  const navigate = useNavigate();
  const { imageUrl } = api.useGetImage({ podcastId: trackedTask?.podcast?.id ?? "" });

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


  const statusConfig: Record<string, { bg: string, text: string, icon: React.ReactNode, label: string }> = {
    pending: { bg: "bg-amber-500/10", text: "text-amber-500", icon: <FaClock />, label: "Pending" },
    in_progress: { bg: "bg-blue-500/10", text: "text-blue-500", icon: <PiSpinnerGap className="animate-spin" />, label: "Processing" },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", icon: <FaCheckCircle />, label: "Ready" },
    failed: { bg: "bg-rose-500/10", text: "text-rose-500", icon: <FaExclamationCircle />, label: "Failed" },
  };

  const status = trackedTask?.status ?? "pending";
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <div
      className="group flex gap-3 p-2 rounded-lg bg-surface hover:bg-surface-highlight transition-all border border-tertiary/10 hover:border-tertiary/30 cursor-pointer items-center"
      onClick={() => {
        if (trackedTask?.status === "completed" && trackedTask?.podcast_id) {
          navigate(`/podcast/${trackedTask.podcast_id}`);
        }
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
        <img
          className={`h-14 w-14 rounded-md object-cover shadow-sm ${!imageUrl && "animate-pulse bg-surface-highlight"}`}
          src={imageUrl ?? "/podcastplaceholdercover.png"}
          alt=""
        />
        {/* Play Overlay */}
        {status === 'completed' && (
          <div className="absolute inset-0 bg-black/30 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <FaPlay className="text-white text-xs drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading font-semibold text-tertiary-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {!trackedTask?.podcast?.title ? (
              <span className="text-tertiary italic">Generating title...</span>
            ) : (
              trackedTask?.podcast?.title
            )}
          </h3>
          {/* Status Badge */}
          <span className={cn(
            "text-[9px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-transparent flex-shrink-0",
            config.bg, config.text
          )}>
            {config.icon}
            {status === "in_progress" && trackedTask?.progress ? `${trackedTask.progress}%` : config.label}
          </span>
        </div>

        <p className="text-[11px] text-tertiary line-clamp-1 mt-0.5">
          {!trackedTask?.podcast?.description ? (
            <span className="opacity-50">Generating description...</span>
          ) : (
            trackedTask?.podcast?.description
          )}
        </p>

        {/* Progress Bar for processing */}
        {status === "in_progress" && (
          <div className="w-full h-1 bg-surface-highlight rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 relative"
              style={{ width: `${trackedTask?.progress ?? 5}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Actions / Meta */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-tertiary font-medium">
        {trackedTask?.podcast?.duration && (
          <span>{Math.floor(trackedTask.podcast.duration / 60)}m {trackedTask.podcast.duration % 60}s</span>
        )}
      </div>
    </div>
  );
}
