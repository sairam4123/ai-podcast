import toast from "react-hot-toast";
import ActionModal, { ActionModalActionRow } from "../@components/ActionModal";
import { api } from "../api/api";
import { PiSpinnerGap } from "react-icons/pi";
import { Input } from "../@components/Input";
import { FaWandMagicSparkles } from "react-icons/fa6";

export function CreatePodcastModal({
  isOpen,
  onClose,
  onCreate
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { topic: string; description: string; style: string; language: string }) => void;
}) {

  const createPodcastMutation = api.useAutoFillPodcastForm({
    onSuccess: (data) => {

      console.log("Auto fill successful:", data);
      if (Array.isArray(data)) {
        if (data.length === 0) {
          toast.error("Generation failed. Please try again.");
          return;
        }
        if ("emsg" in data[0]) {
          toast.error(data[0].emsg as string);
          return;
        }
      }

      toast.success("Filled the form successfully. You can now edit the details and create the podcast.");
      onCreate({
        topic: data.topic,
        description: data.description,
        style: data.style,
        language: data.language,
      });
    }
  });

  return <ActionModal
    title="Auto-Fill with AI"
    description="Enter a topic and let AI generate the best description, style, and language settings for you."
    isOpen={isOpen}
    onClose={onClose}
  >
    <div className="flex flex-col sm:min-w-80 md:min-w-96 gap-4">
      <form className="flex flex-col gap-4">
        <Input
          label="Topic"
          name="topic"
          placeholder="e.g., The Future of AI, History of Rome"
          autoFocus
        />

        <ActionModalActionRow buttons={[
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors cursor-pointer text-sm"
          >
            Cancel
          </button>,
          <button
            type="submit"
            disabled={createPodcastMutation.isLoading}
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest('form') as HTMLFormElement;
              const formData = new FormData(form);
              const topic = formData.get('topic') as string;

              if (!topic) {
                toast.error("Please enter a topic.");
                return;
              }

              const data = { topic };
              console.log("Creating podcast with data:", data);
              createPodcastMutation.mutate(data);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[image:var(--gradient-primary)] text-white font-medium transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-lg shadow-cyan-500/20 hover:brightness-110 border-0"
          >
            {createPodcastMutation.isLoading ? (
              <PiSpinnerGap className="animate-spin text-lg" />
            ) : (
              <FaWandMagicSparkles className="text-sm" />
            )}
            Generate
          </button>
        ]} />
      </form>
    </div>
  </ActionModal>
}