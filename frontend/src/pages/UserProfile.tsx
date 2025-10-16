import { useParams } from "react-router";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { ProfileAvatarIcon } from "../@components/AvatarIcon";
import PodcastCardSkeleton, {
  HorizontalPodcastCard,
} from "../@components/PodcastCard";
import { FaSpinner } from "react-icons/fa";
import { FaEye, FaPodcast, FaScaleBalanced } from "react-icons/fa6";
import { formatNumber } from "../utils/formatNumber";

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
        <div className="flex flex-col flex-2/7 bg-sky-500/20 border overflow-y-auto border-sky-300/50 space-y-2 p-2 rounded-lg">
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
          <p className="text-md pl-3 text-xl mt-4  font-semibold text-gray-300">
            Statistics
          </p>
          <div className="grid grid-cols-3 place-items-center gap-2 text-gray-100">
            <div className="rounded-md bg-gradient-to-b to-sky-950 shadow-md from-sky-900 h-32 w-32 border-1 px-2 py-1 flex flex-col items-center justify-center gap-2">
              <FaPodcast className="text-6xl" />
              <p className="text-3xl">{userData?.total_podcasts ?? 0}</p>
            </div>
            <div className="rounded-md bg-gradient-to-b to-sky-950 shadow-md from-sky-900 h-32 w-32 border-1 px-2 py-1 flex flex-col items-center justify-center gap-2">
              <FaEye className="text-6xl" />
              <p className="text-3xl">
                {formatNumber(userData?.total_views ?? 0)}
              </p>
            </div>
            <div className="rounded-md bg-gradient-to-b to-sky-950 shadow-md from-sky-900 h-32 w-32 border-1 px-2 py-1 flex flex-col items-center justify-center gap-2">
              <FaScaleBalanced className="text-6xl" />
              <p className="text-3xl">
                {formatNumber(userData?.net_likes ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-5/7 bg-sky-500/20 border overflow-y-auto border-sky-300/50 space-y-2 p-2 rounded-lg">
          <div className="flex flex-col bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
              Favourites
            </p>
            <div className="flex flex-row space-x-2 overflow-auto">
              {/* {isLoading && ( */}
              <div className="flex flex-row space-x-2 overflow-auto">
                {Array.from({ length: 5 }).map((_, index) => (
                  <PodcastCardSkeleton key={index} />
                ))}
              </div>
              {/* )} */}
              {/* {data?.results?.map((podcast) => {
                  return <PodcastCard key={podcast.id} podcast={podcast} />;
                })} */}
            </div>
          </div>
          <div className="flex flex-col flex-5/7 bg-sky-500/20 border overflow-y-sroll border-sky-300/50 space-y-2 p-2 rounded-lg">
            <div className="flex flex-col justify-center">
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
      </div>
    </main>
  );
}
