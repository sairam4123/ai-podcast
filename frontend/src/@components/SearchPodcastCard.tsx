import { Podcast } from "../@types/Podcast";
import { formatDuration } from "../utils/formatDuration";
import { FaCircle, FaPlay, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { useNavigate } from "react-router";

export const SearchPodcastCard = ({ podcast }: { podcast: Podcast }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/podcast/${podcast.id}`)}
      className="p-3 cursor-pointer hover:bg-cyan-800/30 w-full flex items-center gap-3 transition-colors"
    >
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white line-clamp-1 hover:text-cyan-300 transition-colors">
          {podcast.podcast_title}
        </h3>
        <p className="text-xs text-cyan-300/60 line-clamp-1">
          {podcast.podcast_description}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-cyan-400/60 flex-shrink-0">
        <span className="flex items-center gap-1">
          <FaPlay className="text-[10px]" />
          {podcast.view_count || 0}
        </span>
        <FaCircle className="text-[3px]" />
        <span className="flex items-center gap-1">
          <FaThumbsUp className="text-[10px]" />
          {podcast.like_count || 0}
        </span>
        <FaCircle className="text-[3px]" />
        <span className="flex items-center gap-1">
          <FaThumbsDown className="text-[10px]" />
          {podcast.dislike_count || 0}
        </span>
        <span className="text-cyan-300/80 font-medium">
          {formatDuration(podcast.duration)}
        </span>
      </div>
    </div>
  );
};
