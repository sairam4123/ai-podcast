import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { CreatePodcastModal } from "../modals/CreatePodcast";
import { SearchBox } from "./SearchBox";
import { getUser, isSignedIn, supabase } from "../lib/supabase";
import MenuButton from "./MenuButton";
import { api } from "../api/api";
import Spinner from "./Spinner";
import { useNavigate } from "react-router";

export function NavBar() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setIsSignedIn] = useState(false);

  const {isLoading, error, data} = api.useGetUserProfile({
    userId: user?.id ?? "",
})

const navigate = useNavigate();

  useEffect(() => {
    async function isSignedInAsync() {
        const signedIn = await isSignedIn();
        setIsSignedIn(signedIn);
        // if (!signedIn) {
        //     window.location.href = "/login";
        // }
    }

    async function getUserAsync() {

        const userData = await getUser();
        if (userData) {
            setUser({ email: userData.email ?? "", id: userData.id });
        } else {
            setUser(null);
        }
        setLoading(false);
    }

    isSignedInAsync();
    getUserAsync();

  }, []);

    return <nav>
        <ul className="flex text-base flex-row items-center space-x-4 p-4 from-sky-700/50 shadow-black/30 shadow-lg to-blue-700/50 bg-linear-330 text-white">
            <li className="font-black text-3xl text-shadow-md "><a onClick={
                (e) => {
                    e.preventDefault();
                    navigate("/");
                }
                
            } href="/">Podolli.AI</a></li>
            <li className="flex-grow text-base flex justify-center">
                <SearchBox variant="xl" />
            </li>
            <li 
            onClick={() => {
                // setIsCreateModalOpen(true);
                navigate("/create");
            }}
            className="bg-sky-300 cursor-pointer hover:bg-sky-200 transition-all duration-100 ease-out text-center flex flex-row items-center justify-center gap-2 p-3 mr-4 rounded-full text-black">
                <FaPlus className="text-lg" />
                Create
            </li>
            {/* <li className=""><a href="/podcasts">Explore</a></li>
            <li className=""><a href="/podcasts">Pricing</a></li> */}
            <li className="">
                {!signedIn ? <a className="text-gray-200 hover:text-white transition-colors" href="/login">
                    Sign&nbsp;In
                </a> : <MenuButton options={[
                    {
                        label: "Profile",
                        value: "profile",
                        onSelect() {
                            navigate(`/user/${user?.id}`);
                            // window.location.href = `/user/${user?.id}`;
                        },
                    },
                    { label: "Podcasts", value: "podcasts", 
                    },
                    { label: "Sign Out", value: "signout", onSelect() {
                        supabase.auth.signOut();
                        console.log("User signed out");
                        setUser(null);
                        setIsSignedIn(false);
                        // window.location.href = "/logout";
                    },
                    isDangerous: true },
                ]}>
                    {data ? data.user.display_name : error ? error.message : <Spinner isLoading={isLoading || loading} size="1.25rem" marginRight="0px"/>
                    }
                    </MenuButton>}
            </li>
        </ul>
        <CreatePodcastModal isOpen={isCreateModalOpen} onClose={() => {
            setIsCreateModalOpen(false);
        }} onCreate={(data) => {
            console.log("Podcast created", data);
            setIsCreateModalOpen(false);
        }}/>
    </nav>
}