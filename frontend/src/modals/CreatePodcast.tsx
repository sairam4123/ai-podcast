import { CgSpinner } from "react-icons/cg";
import ActionModal, { ActionModalActionRow } from "../@components/ActionModal";
import { api } from "../api/api";
import { ImSpinner9 } from "react-icons/im";
import { FaSpinner } from "react-icons/fa6";
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

    const createPodcastMutation = api.useGeneratePodcast({
        onSuccess: (data) => {
            console.log("Podcast created successfully:", data);
        }
    });

    return <ActionModal 
        title="Create Podcast" 
        description="Fill out the form below to create a new podcast." 
        isOpen={isOpen} 
        onClose={onClose}
    >
        <div className="flex flex-col min-w-144 gap-4">
            <form className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Topic</label>
                <input type="text" name="topic" className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter podcast topic" />
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea name="description" className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter podcast description" rows={4}></textarea>
                <label className="text-sm font-semibold text-gray-700">Style</label>
                <input type="text" name="style" className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter podcast style (e.g., interview, solo, etc.)" />

                <label className="text-sm font-semibold text-gray-700">Language</label>
                <input type="text" name="language" className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter podcast language" />

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
      description: formData.get('description') as string,
      style: formData.get('style') as string,
      language: formData.get('language') as string,
    };
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
  Create Podcast
</button>

                ]} />
            </form>
        </div>
    </ActionModal>
}