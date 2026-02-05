import { useParams, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { api } from "../api/api";
import { ProfileAvatarIcon } from "../@components/AvatarIcon";
import PodcastCardSkeleton, {
  HorizontalPodcastCard,
} from "../@components/PodcastCard";
import { FaSpinner, FaSignOutAlt, FaColumns } from "react-icons/fa";
import { FaEye, FaPodcast, FaScaleBalanced } from "react-icons/fa6";
import { formatNumber } from "../utils/formatNumber";
import { useState } from "react";
import Button from "../@components/Button";
import { PiRowsFill } from "react-icons/pi";
import { cn } from "../lib/cn";

export default function UserProfile() {
  const { user_id } = useParams<{ user_id: string }>();
  const navigate = useNavigate();
  const [layout, setLayout] = useState<"sidebar" | "header">("header");

  const { data: userData } = api.useGetUserProfile({
    userId: user_id ?? "",
  });

  const { data: listenHistory, isLoading: isListenHistoryLoading } =
    api.useGetListenHistory({});

  const ProfileStats = () => (
    <div className="grid grid-cols-3 gap-3 w-full">
      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-tertiary/10">
        <FaPodcast className="text-2xl text-primary mb-1" />
        <span className="text-xl font-bold text-tertiary-foreground">
          {userData?.total_podcasts ?? 0}
        </span>
        <span className="text-xs text-tertiary">Podcasts</span>
      </div>
      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-tertiary/10">
        <FaEye className="text-2xl text-primary mb-1" />
        <span className="text-xl font-bold text-tertiary-foreground">
          {formatNumber(userData?.total_views ?? 0)}
        </span>
        <span className="text-xs text-tertiary">Views</span>
      </div>
      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-tertiary/10">
        <FaScaleBalanced className="text-2xl text-primary mb-1" />
        <span className="text-xl font-bold text-tertiary-foreground">
          {formatNumber(userData?.net_likes ?? 0)}
        </span>
        <span className="text-xs text-tertiary">Likes</span>
      </div>
    </div>
  );

  const ListenHistory = () => (
    <section className="flex-1 flex flex-col min-h-0 bg-surface/30 glass-panel p-4 border-tertiary/20">
      <h3 className="font-heading text-lg font-semibold text-tertiary-foreground mb-3 flex-shrink-0">
        Listen History
      </h3>
      {isListenHistoryLoading ? (
        <div className="flex items-center justify-center h-32">
          <FaSpinner className="animate-spin text-3xl text-primary" />
        </div>
      ) : listenHistory && listenHistory.length > 0 ? (
        <div className="overflow-y-auto flex-1 space-y-3 pr-1 pb-4 custom-scrollbar">
          {listenHistory.map((podcast) => (
            <HorizontalPodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      ) : (
        <p className="text-tertiary text-center py-8">
          No listen history yet.
        </p>
      )}
    </section>
  );

  const Favourites = () => (
    <section className="bg-surface/30 glass-panel p-4 border-tertiary/20">
      <h3 className="font-heading text-lg font-semibold text-tertiary-foreground mb-3">
        Favourites
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="w-32 flex-shrink-0">
            <PodcastCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1800px] mx-auto w-full lg:h-[calc(100vh-6rem)] overflow-hidden">

      {/* Layout Toggle */}
      <div className="flex justify-end gap-2 absolute top-20 right-8 z-50">
        <button
          onClick={() => setLayout("sidebar")}
          className={cn(
            "p-2 rounded-lg transition-all border",
            layout === "sidebar"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-tertiary hover:text-tertiary-foreground border-tertiary/20"
          )}
          title="Sidebar Layout"
        >
          <FaColumns />
        </button>
        <button
          onClick={() => setLayout("header")}
          className={cn(
            "p-2 rounded-lg transition-all border",
            layout === "header"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-tertiary hover:text-tertiary-foreground border-tertiary/20"
          )}
          title="Header Layout"
        >
          <PiRowsFill />
        </button>
      </div>

      {layout === "sidebar" ? (
        // LAYOUT A: Sidebar Right (Matches PodcastNew)
        <div className="flex flex-col lg:flex-row gap-6 h-full items-start">
          {/* Main Content (Left) */}
          <div className="flex flex-col flex-1 h-full min-h-0 space-y-6 overflow-hidden">
            <Favourites />
            <ListenHistory />
          </div>

          {/* Profile Sidebar (Right, Sticky) */}
          <div className="lg:w-80 glass-panel p-6 space-y-6 flex-shrink-0 bg-surface/40 border-tertiary/20 sticky top-0 custom-scrollbar overflow-y-auto max-h-full">
            <ProfileAvatarIcon
              imageUrl={undefined}
              id={user_id}
              className="w-24 h-24 border-4 border-surface shadow-lg rounded-full mx-auto"
            />
            <h2 className="font-heading text-xl font-bold text-tertiary-foreground text-center">
              {userData?.user?.display_name}
            </h2>
            <div className="pt-4">
              <p className="text-tertiary text-xs uppercase tracking-widest font-semibold mb-3 text-center">Statistics</p>
              <ProfileStats />
            </div>

            <Button
              variant="danger"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Logged out successfully");
                navigate("/login");
              }}
              className="w-full mt-auto"
            >
              <FaSignOutAlt className="mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      ) : (
        // LAYOUT B: Horizontal Header
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          {/* Header Hero */}
          <div className="flex flex-col md:flex-row items-center gap-8 glass-panel p-8 bg-surface/40 border-tertiary/20 shrink-0">
            <ProfileAvatarIcon
              imageUrl={undefined}
              id={user_id}
              className="w-32 h-32 border-4 border-surface shadow-xl rounded-full"
            />
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="font-heading text-3xl font-bold text-tertiary-foreground">
                  {userData?.user?.display_name}
                </h2>
                <p className="text-tertiary">Podcast Enthusiast</p>
              </div>
              <div className="flex gap-4 justify-center md:justify-start">
                <Button
                  variant="danger"
                  className="px-6"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast.success("Logged out successfully");
                    navigate("/login");
                  }}
                >
                  <FaSignOutAlt className="mr-2" /> Sign Out
                </Button>
              </div>
            </div>
            <div className="w-full md:w-auto min-w-[300px]">
              <p className="text-tertiary text-xs uppercase tracking-widest font-semibold mb-3 text-center md:text-left">Statistics</p>
              <ProfileStats />
            </div>
          </div>

          {/* Content Below */}
          <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden pb-4">
            <Favourites />
            <ListenHistory />
          </div>
        </div>
      )}
    </div>
  );
}
