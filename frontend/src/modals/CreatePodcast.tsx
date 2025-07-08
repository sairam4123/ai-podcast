import toast from "react-hot-toast";
import ActionModal, { ActionModalActionRow } from "../@components/ActionModal";
import { api } from "../api/api";
import { PiSpinnerGap } from "react-icons/pi";

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
                    toast.error("Login failed. Please check your credentials and try again.");
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
            // console.log("Podcast created successfully:", data);
        }
    });

    return <ActionModal 
        title="Auto fill Podcast Form" 
        description="Filling with AI generated data" 
        isOpen={isOpen} 
        onClose={onClose}
    >
        <div className="flex flex-col sm:min-w-72 md:min-w-144 gap-4">
            <form className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Topic</label>
                <input type="text" name="topic" className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter podcast topic" />
                
                <ActionModalActionRow buttons={[
                    <button type="button" onClick={() => {
                        onClose();
                    }} className="bg-gray-300 text-gray-800 rounded-lg px-4 py-2 hover:bg-gray-400 transition-colors cursor-pointer">Cancel</button>,
<button
  type="submit"
  onClick={(e) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form') as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      topic: formData.get('topic') as string,
    }
    console.log("Creating podcast with data:", data);
    createPodcastMutation.mutate(data);
  }}
  className="bg-blue-500 flex items-center text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors cursor-pointer"
>
  <div
    className="transition-all duration-300 overflow-hidden"
    style={{
      width: createPodcastMutation.isLoading ? '1.25rem' : '0px', // 1.25rem = 20px
      height: createPodcastMutation.isLoading ? '1.25rem' : '0px',
      marginRight: createPodcastMutation.isLoading ? '0.5rem' : '0px',
    }}
  >
    <PiSpinnerGap className="animate-spin text-xl" />
  </div>
  Generate
</button>

                ]} />
            </form>
        </div>
    </ActionModal>
}