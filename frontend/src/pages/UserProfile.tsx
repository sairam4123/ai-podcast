import { useParams } from "react-router";
import { NavBar } from "../@components/NavBar";
import { api } from "../api/api";
import { ProfileAvatarIcon } from "../@components/AvatarIcon";

export default function UserProfile() {

    const { user_id } = useParams<{ user_id: string }>();

    const {data: userData, isLoading: isUserLoading} = api.useGetUserProfile({userId: user_id ?? ""});
    console.log("UserProfile", {userData, isUserLoading});
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
                    <ProfileAvatarIcon imageUrl={undefined} id={user_id} className="w-32 border-2 rounded-full aspect-square mx-auto h-auto object-cover" />
                    <h2 className="text-xl text-center font-bold text-white">
                        {userData?.user?.display_name}
                    </h2>
                        {/* <p className="text-gray-200">{}</p> */}
                        {/* <p className="text-gray-400 text-sm">
                          {podcast?.duration ? formatDuration(podcast?.duration) : "N/A"}
                        </p> */}
                </div>
                <div className="flex flex-col flex-3/5 bg-sky-500/20 border overflow-y-auto border-sky-300/50 space-y-2 p-2 rounded-lg">
                <div className="flex flex-row items-center justify-center">

                <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
                    Listen History will be displayed here. (WIP)
                    maybe your favourite podcasts, created playlists, etc.
                </p>
                </div>

                </div>
            </div>
            </main>
    )  
}