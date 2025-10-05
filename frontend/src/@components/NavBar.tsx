import { useEffect, useState } from "react";
import { FaCross, FaPlus, FaSearch } from "react-icons/fa";
import { CreatePodcastModal } from "../modals/CreatePodcast";
import { SearchBox } from "./SearchBox";
import { getUser, isSignedIn, supabase } from "../lib/supabase";
import MenuButton from "./MenuButton";
import { api } from "../api/api";
import Spinner from "./Spinner";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { ProfileAvatarIcon } from "./AvatarIcon";
import Button from "./Button";
import { FaX } from "react-icons/fa6";
import { AnimatePresence, motion } from "framer-motion";

export function NavBar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setIsSignedIn] = useState(false);
  const [searchFlyoutIsOpen, setSearchFlyoutIsOpen] = useState(true);

  const { isLoading, error, data } = api.useGetUserProfile({
    userId: user?.id ?? "",
  });

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

  return (
    <nav className="relative">
      <ul className="flex text-base flex-row items-center space-x-4 p-4 from-sky-950/50 shadow-black/30 shadow-lg to-sky-900/50 bg-linear-330 text-white">
        <li className="font-black flex flex-row gap-2 text-3xl text-shadow-md ">
          <img
            className="h-10 w-auto object-cover scale-180"
            src="/logo.png"
            alt="Podolli.AI Logo"
          />

          <a
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            className="lg:text-3xl text-lg my-auto"
            href="/"
          >
            Podolli.AI
          </a>
        </li>
        <li className="flex-grow hidden text-base md:flex justify-center">
          <SearchBox variant="xl" />
        </li>
        <li className="flex-grow md:hidden flex justify-center"></li>
        <li className="bg-sky-700 cursor-pointer hover:bg-sky-500 transition-all duration-100 ease-out text-center flex flex-row items-center justify-center gap-2 p-3 rounded-full text-white md:hidden">
          <FaSearch
            className="md:hidden cursor-pointer"
            onClick={() => {
              setSearchFlyoutIsOpen(true);
            }}
          />
        </li>
        <li
          onClick={() => {
            // setIsCreateModalOpen(true);
            navigate("/create");
          }}
          className="bg-sky-700 cursor-pointer hover:bg-sky-500 transition-all duration-100 ease-out text-center flex flex-row items-center justify-center gap-2 p-3 mr-4 rounded-full text-white"
        >
          <FaPlus className="text-lg" />
          <p className="lg:flex hidden">Create</p>
        </li>
        {/* <li className=""><a href="/podcasts">Explore</a></li>
            <li className=""><a href="/podcasts">Pricing</a></li> */}
        <li className="">
          {!signedIn ? (
            <a
              className="text-gray-200 hover:text-white transition-colors"
              href="/login"
            >
              Sign&nbsp;In
            </a>
          ) : (
            <MenuButton
              options={[
                {
                  label: "Profile",
                  value: "profile",
                  onSelect() {
                    navigate(`/user/${user?.id}`);
                    // window.location.href = `/user/${user?.id}`;
                  },
                },
                { label: "Podcasts", value: "podcasts" },
                {
                  label: "Sign Out",
                  value: "signout",
                  onSelect() {
                    supabase.auth.signOut();
                    toast.success("Signed out successfully");
                    console.log("User signed out");
                    setUser(null);
                    setIsSignedIn(false);
                    // window.location.href = "/logout";
                  },
                  isDangerous: true,
                },
              ]}
            >
              <div className="flex flex-row items-center gap-2">
                <ProfileAvatarIcon id={user?.id} />
                <p className="hidden lg:flex text-sm md:text-base text-shadow-md font-semibold text-gray-50">
                  {data ? (
                    data.user.display_name
                  ) : error ? (
                    error.message
                  ) : (
                    <Spinner
                      isLoading={isLoading || loading}
                      size="1.25rem"
                      marginRight="0px"
                    />
                  )}
                </p>
              </div>
            </MenuButton>
          )}
        </li>
      </ul>
      <CreatePodcastModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        onCreate={(data) => {
          console.log("Podcast created", data);
          setIsCreateModalOpen(false);
        }}
      />

      <AnimatePresence>
        {searchFlyoutIsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute inset-0 bg-gradient-to-b from-sky-950 to-black z-20 p-4 h-screen w-screen"
          >
            <div className="w-full flex flex-row items-center px-2 py-1 justify-between">
              <p className="text-xl text-white ">Search Podcasts</p>
              <button
                className=""
                onClick={() => {
                  setSearchFlyoutIsOpen(false);
                }}
              >
                <FaX className="text-red-500" />
              </button>
            </div>
            <div className="mx-auto w-full flex flex-row items-center">
              <SearchBox
                onClose={() => setSearchFlyoutIsOpen(false)}
                variant="lg"
                contentClassName="flex flex-col md:h-48 h-96 overflow-y-auto"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
