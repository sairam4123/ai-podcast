import { useParams } from "react-router";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { ProfileAvatarIcon } from "../@components/AvatarIcon";
import { HorizontalPodcastCard } from "../@components/PodcastCard";
import { FaSpinner } from "react-icons/fa";

export default function UserProfile() {
  const { user_id } = useParams<{ user_id: string }>();

  const { data: userData, isLoading: isUserLoading } = api.useGetUserProfile({
    userId: user_id ?? "",
  });
  console.log("UserProfile", { userData, isUserLoading });

  const { data: listenHistory, isLoading: isListenHistoryLoading } =
    api.useGetListenHistory({});
  console.log("ListenHistory", { listenHistory, isListenHistoryLoading });
  return (
    <main className="flex flex-col lg:h-screen min-h-screen bg-radial from-sky-950 to-black">
      <NavBar />
      <div className="flex flex-col lg:flex-row flex-1 p-4 gap-4 pb-32 overflow-hidden">
        <div className="flex flex-col flex-2/5 bg-sky-500/20 border overflow-y-auto border-sky-300/50 space-y-2 p-2 rounded-lg">
          {/* <img
                        src={"/podcastplaceholdercover.png"}
                        alt={userData?.user.display_name}
                        className="w-32 aspect-square mx-auto h-auto object-cover rounded-lg"
                    /> */}
          <ProfileAvatarIcon
            imageUrl={undefined}
            id={user_id}
            className="w-32 border-2 rounded-full aspect-square mx-auto h-auto object-cover"
          />
          <h2 className="text-xl text-center font-bold text-white">
            {userData?.user?.display_name}
          </h2>
          {/* <p className="text-gray-200">{}</p> */}
          {/* <p className="text-gray-400 text-sm">
                          {podcast?.duration ? formatDuration(podcast?.duration) : "N/A"}
                        </p> */}
        </div>
        <div className="flex flex-col flex-3/5 bg-sky-500/20 border overflow-y-auto border-sky-300/50 space-y-2 p-2 rounded-lg">
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
              Listen History
            </p>
            {isListenHistoryLoading && (
              <div className="flex flex-col items-center justify-center h-96">
                <FaSpinner className="animate-spin text-4xl text-gray-200" />
              </div>
            )}

            {!isListenHistoryLoading &&
              listenHistory &&
              listenHistory.length > 0 && (
                <div className="flex flex-col w-full p-4 overflow-hidden flex-1">
                  <p className="text-md ml-4 mt-2 font-semibold text-shadow-md text-gray-300">
                    ({listenHistory.length}{" "}
                    {listenHistory.length === 1 ? "podcast" : "podcasts"})
                  </p>
                  <div className="flex flex-col space-y-2 mt-4 overflow-x-visible mb-4 overflow-y-visible">
                    {listenHistory?.map((podcast) => (
                      <HorizontalPodcastCard
                        key={podcast.id}
                        podcast={podcast}
                      />
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </main>
  );
}
