import { useState } from "react";
import { FaHistory, FaHeart, FaList, FaMicrophone } from "react-icons/fa";
import { api } from "../api/api";
import PodcastCardSkeleton, { PodcastCard } from "../@components/PodcastCard";
import { useGetQueue } from "../api/getQueue";
import { cn } from "../lib/cn";
import { PodcastGenTask } from "../@types/PodcastGenTask";
import { motion, AnimatePresence } from "framer-motion";
import { getUser } from "../lib/supabase";
import { useEffect } from "react";

// Tab configuration
const TABS = [
    { id: "history", label: "History", icon: FaHistory },
    { id: "liked", label: "Liked", icon: FaHeart },
    { id: "queue", label: "Queue", icon: FaList },
    { id: "created", label: "Your Podcasts", icon: FaMicrophone },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Library() {
    const [activeTab, setActiveTab] = useState<TabId>("history");
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        getUser().then(u => setUserId(u?.id ?? null));
    }, []);

    return (
        <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-8 space-y-8">
            <div className="space-y-4">
                <h1 className="font-heading text-3xl font-bold text-tertiary-foreground">Library</h1>

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-tertiary/10">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                    : "text-tertiary hover:text-tertiary-foreground hover:bg-surface-highlight"
                            )}
                        >
                            <tab.icon className={cn("text-sm", activeTab === tab.id ? "" : "opacity-70")} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "history" && <HistoryTab />}
                        {activeTab === "liked" && <LikedTab />}
                        {activeTab === "queue" && <QueueTab />}
                        {activeTab === "created" && userId && <CreatedTab userId={userId} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function HistoryTab() {
    const { data: history, isLoading } = api.useGetListenHistory({ limit: 20 });

    if (isLoading) return <LoadingGrid />;

    if (!history || history.length === 0) {
        return <EmptyState icon={FaHistory} message="No listening history yet" subMessage="Start listening to podcasts to see them here" />;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {history.map((podcast) => (
                <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
        </div>
    );
}

function LikedTab() {
    const { data, isLoading } = api.useGetLikedPodcasts({ limit: 20 });
    const likedPodcasts = data?.results;

    if (isLoading) return <LoadingGrid />;

    if (!likedPodcasts || likedPodcasts.length === 0) {
        return <EmptyState icon={FaHeart} message="No liked podcasts" subMessage="Like podcasts to save them to your library" />;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {likedPodcasts.map((podcast) => (
                <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
        </div>
    );
}

function QueueTab() {
    const { data, isLoading } = useGetQueue();
    const tasks = data?.tasks;

    if (isLoading) return <LoadingList />;

    if (!tasks || tasks.length === 0) {
        return <EmptyState icon={FaList} message="Queue is empty" subMessage="Generated podcasts in progress will appear here" />;
    }

    return (
        <div className="space-y-4 max-w-4xl">
            {tasks.map((task) => (
                <QueueItem key={task.id} task={task} />
            ))}
        </div>
    );
}

function CreatedTab({ userId }: { userId: string }) {

    return <CreatedPodcastsList userId={userId} />;
}

import { useFetchWithAuth } from "../lib/useFetch";
import { API_URL } from "../api/api";
import { Podcast } from "../@types/Podcast";

function CreatedPodcastsList({ userId }: { userId: string }) {
    const { data, loading: isLoading } = useFetchWithAuth<{ results: Podcast[] }>(
        `${API_URL}/user/${userId}/podcasts`,
        { enabled: !!userId }
    );

    const podcasts = data?.results;

    if (isLoading) return <LoadingGrid />;

    if (!podcasts || podcasts.length === 0) {
        return <EmptyState icon={FaMicrophone} message="No podcasts created yet" subMessage="Create your first podcast to see it here" />;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {podcasts.map((podcast) => (
                <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
        </div>
    );
}


function QueueItem({ task }: { task: PodcastGenTask }) {
    const isPending = task.status === "pending" || task.status === "in_progress";
    const isFailed = task.status === "failed";
    const isCompleted = task.status === "completed";

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-tertiary/10">
            <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                isPending ? "bg-amber-500/10 text-amber-500" :
                    isFailed ? "bg-rose-500/10 text-rose-500" :
                        "bg-emerald-500/10 text-emerald-500"
            )}>
                {isPending && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {isFailed && <span className="text-xl">!</span>}
                {isCompleted && <span className="text-xl">✓</span>}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-tertiary-foreground truncate">
                    {task.generation_data?.topic || "Unknown Topic"}
                </h4>
                <p className="text-sm text-tertiary">
                    {task.progress_message || task.status}
                </p>
            </div>

            {(task.progress ?? 0) > 0 && (task.progress ?? 0) < 100 && (
                <div className="text-sm font-bold text-tertiary-foreground">
                    {task.progress}%
                </div>
            )}
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <PodcastCardSkeleton key={i} />
            ))}
        </div>
    );
}

function LoadingList() {
    return (
        <div className="space-y-4 max-w-4xl">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ icon: Icon, message, subMessage }: { icon: any, message: string, subMessage: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-highlight flex items-center justify-center mb-4">
                <Icon className="text-2xl text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-tertiary-foreground mb-1">{message}</h3>
            <p className="text-tertiary/70 max-w-sm">{subMessage}</p>
        </div>
    );
}
