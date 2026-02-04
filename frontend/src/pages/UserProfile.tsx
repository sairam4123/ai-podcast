import { useParams, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { api } from "../api/api";
import { ProfileAvatarIcon } from "../@components/AvatarIcon";
import PodcastCardSkeleton, {
  HorizontalPodcastCard,
} from "../@components/PodcastCard";
import { FaSpinner, FaSignOutAlt } from "react-icons/fa";
import { FaEye, FaPodcast, FaScaleBalanced } from "react-icons/fa6";
import { formatNumber } from "../utils/formatNumber";

export default function UserProfile() {
  const { user_id } = useParams<{ user_id: string }>();
  const navigate = useNavigate();

  const { data: userData } = api.useGetUserProfile({
    userId: user_id ?? "",
  });

  const { data: listenHistory, isLoading: isListenHistoryLoading } =
    api.useGetListenHistory({});

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-7xl mx-auto lg:h-[calc(100vh-6rem)]">
      {/* Profile Sidebar */}
      <div className="lg:w-80 glass-panel p-6 space-y-6 flex-shrink-0 overflow-y-auto">
        <ProfileAvatarIcon
          imageUrl={undefined}
          id={user_id}
          className="w-24 h-24 border-2 border-cyan-500/50 rounded-full mx-auto"
        />
        <h2 className="font-heading text-xl font-bold text-white text-center">
          {userData?.user?.display_name}
        </h2>

        <div className="pt-4">
          <p className="text-cyan-300/70 text-sm mb-3">Statistics</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-950/60">
              <FaPodcast className="text-2xl text-cyan-400 mb-1" />
              <span className="text-xl font-bold text-white">
                {userData?.total_podcasts ?? 0}
              </span>
              <span className="text-xs text-cyan-400/60">Podcasts</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-950/60">
              <FaEye className="text-2xl text-cyan-400 mb-1" />
              <span className="text-xl font-bold text-white">
                {formatNumber(userData?.total_views ?? 0)}
              </span>
              <span className="text-xs text-cyan-400/60">Views</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-950/60">
              <FaScaleBalanced className="text-2xl text-cyan-400 mb-1" />
              <span className="text-xl font-bold text-white">
                {formatNumber(userData?.net_likes ?? 0)}
              </span>
              <span className="text-xs text-cyan-400/60">Likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 glass-panel p-4 overflow-hidden space-y-6">
        {/* Favourites */}
        <section>
          <h3 className="font-heading text-lg font-semibold text-white mb-3">
            Favourites
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <PodcastCardSkeleton key={index} />
            ))}
          </div>
        </section>

        {/* Listen History */}
        <section className="flex-1 flex flex-col min-h-0">
          <h3 className="font-heading text-lg font-semibold text-white mb-3 flex-shrink-0">
            Listen History
          </h3>
          {isListenHistoryLoading ? (
            <div className="flex items-center justify-center h-32">
              <FaSpinner className="animate-spin text-3xl text-cyan-400" />
            </div>
          ) : listenHistory && listenHistory.length > 0 ? (
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {listenHistory.map((podcast) => (
                <HorizontalPodcastCard key={podcast.id} podcast={podcast} />
              ))}
            </div>
          ) : (
            <p className="text-cyan-400/60 text-center py-8">
              No listen history yet.
            </p>
          )}
        </section>
      </div>
      <div className="lg:hidden mt-6">
        <button
          onClick={async () => {
            try {
              await supabase.auth.signOut();
              toast.success("Logged out successfully");
              navigate("/login");
            } catch (error) {
              toast.error("Failed to logout");
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-medium border border-red-500/20"
        >
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
