import { PiSpinnerGap } from "react-icons/pi";
import { ActionModalActionRow } from "../@components/ActionModal";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { useState } from "react";

export default function Create() {
  const createPodcastMutation = api.useGeneratePodcast({
    onSuccess: (data) => {
      console.log("Podcast created successfully:", data);
    },
  });

  const [description, setDescription] = useState("");

  return (
    <div className="flex flex-col select-none min-h-screen bg-radial from-sky-700 to-blue-900">
      <NavBar />
      <div className="flex flex-row flex-grow gap-4 p-4">
        <div className="flex flex-col flex-1/3 bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
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
              rows={4}
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
        <div className="flex flex-col flex-2/3 bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
          <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
            Podcasts
          </p>
          <div className="flex flex-col w-full h-full px-2 py-1">
            
          </div>
        </div>
      </div>
    </div>
  );
}


function HorizontalPodcastCard({}: {
    task: 
}) {
    return <div className="h-28 w-full bg-sky-900 gap-2 rounded-lg hover:scale-102 transition-all ease-in-out hover:brightness-110 flex flex-row" tabIndex={0}>
              <div className="p-1">
                <img
                  className="h-26 w-auto rounded-lg aspect-square mask-radial-from-91% mask-radial-fartest-side mask-r-from-97% mask-t-from-97% mask-b-from-97% mask-l-from-97%"
                  src={
                    // imageUrl ??
                    "https://i.pinimg.com/736x/e4/fb/2a/e4fb2a1bf8d9ca39b869fa412d72fce2.jpg"
                  }
                ></img>
              </div>
              <div>
                <div className="flex flex-col flex-grow">
                  <div>
                    <p className="text-lg font-bold text-gray-100">
                      <a
                        // href={`/podcast/${currentPodcast?.id}`}
                        className="hover:underline hover:text-sky-50 transition-all cursor-pointer duration-150 ease-in-out"
                      >
                        {null?.podcast_title ?? "Podcast Title.."}
                      </a>
                    </p>
                    <p className="text-sm cursor-default text-gray-300">
                      {null?.podcast_description ?? "Description..."}
                    </p>
                    {/* <p className="text-xs text-gray-400">{formatDuration(currentPodcast?.duration)}</p> */}
                  </div>
                </div>
              </div>
            </div>
}