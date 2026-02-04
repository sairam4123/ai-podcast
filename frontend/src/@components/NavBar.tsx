import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { CreatePodcastModal } from "../modals/CreatePodcast";
import { SearchBox } from "./SearchBox";
import { getUser, isSignedIn, supabase } from "../lib/supabase";
import MenuButton from "./MenuButton";
import { api } from "../api/api";
import Spinner from "./Spinner";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { ProfileAvatarIcon } from "./AvatarIcon";
import { FaX } from "react-icons/fa6";
import { AnimatePresence, motion } from "framer-motion";

export function NavBar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setIsSignedIn] = useState(false);
  const [searchFlyoutIsOpen, setSearchFlyoutIsOpen] = useState(false);

  const { isLoading, error, data } = api.useGetUserProfile({
    userId: user?.id ?? "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    async function isSignedInAsync() {
      const signedIn = await isSignedIn();
      setIsSignedIn(signedIn);
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
      {/* Main Nav Bar */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 bg-surface/80 backdrop-blur-md border-b border-tertiary/20">
        {/* Logo */}
        <a
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          href="/"
          className="flex items-center gap-2 group"
        >
          <img
            className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            src="/logo.png"
            alt="Podolli.AI Logo"
          />
          <span className="font-heading text-xl md:text-2xl font-bold text-tertiary-foreground group-hover:text-primary transition-colors">
            Podolli.AI
          </span>
        </a>

        {/* Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <SearchBox variant="xl" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchFlyoutIsOpen(true)}
            className="md:hidden p-2.5 rounded-full bg-surface hover:bg-surface-highlight text-tertiary hover:text-tertiary-foreground transition-all border border-tertiary/10"
          >
            <FaSearch className="text-lg" />
          </button>

          {/* Create Button */}
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all active:scale-95 shadow-sm shadow-primary/20"
          >
            <FaPlus className="text-sm" />
            <span className="hidden lg:inline">Create</span>
          </button>

          {/* User Menu */}
          {!signedIn ? (
            <a
              className="px-4 py-2 text-tertiary hover:text-tertiary-foreground font-medium transition-colors"
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
                  },
                },
                { label: "Podcasts", value: "podcasts" },
                {
                  label: "Sign Out",
                  value: "signout",
                  onSelect() {
                    supabase.auth.signOut();
                    toast.success("Signed out successfully");
                    setUser(null);
                    setIsSignedIn(false);
                  },
                  isDangerous: true,
                },
              ]}
            >
              <div className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-highlight transition-colors">
                <ProfileAvatarIcon id={user?.id} />
                <span className="hidden lg:block text-sm font-medium text-tertiary-foreground pr-2">
                  {data ? (
                    data.user?.display_name ?? "N/A"
                  ) : error ? (
                    <span className="text-rose-400">Error</span>
                  ) : (
                    <Spinner isLoading={isLoading || loading} size="1rem" marginRight="0px" />
                  )}
                </span>
              </div>
            </MenuButton>
          )}
        </div>
      </div>

      <CreatePodcastModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(data) => {
          console.log("Podcast created", data);
          setIsCreateModalOpen(false);
        }}
      />

      {/* Mobile Search Flyout */}
      <AnimatePresence>
        {searchFlyoutIsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-50 bg-surface/98 backdrop-blur-lg"
          >
            <div className="flex items-center justify-between p-4 border-b border-tertiary/20">
              <h2 className="text-lg font-heading font-semibold text-tertiary-foreground">Search</h2>
              <button
                onClick={() => setSearchFlyoutIsOpen(false)}
                className="p-2 rounded-full hover:bg-surface-highlight text-tertiary hover:text-tertiary-foreground transition-colors"
              >
                <FaX />
              </button>
            </div>
            <div className="p-4">
              <SearchBox
                onClose={() => setSearchFlyoutIsOpen(false)}
                variant="lg"
                contentClassName="flex flex-col h-[70vh] overflow-y-auto"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
