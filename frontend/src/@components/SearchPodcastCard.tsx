import React from "react";
import { Podcast } from "../@types/Podcast";
import { formatDuration } from "../utils/formatDuration";
import { FaCircle, FaPlay, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { useNavigate } from "react-router";

export const SearchPodcastCard = ({ podcast }: { podcast: Podcast }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => {
        console.log(podcast.id);
        navigate(`/podcast/${podcast.id}`);
      }}
      className="h-12 p-4 cursor-pointer hover:bg-gray-100 rounded-lg w-full flex items-center gap-2 justify-start flex-row"
    >
      <div className="flex flex-col">
        <h3 className="text-[16px] line-clamp-1 hover:underline font-semibold">
          {podcast.podcast_title}
        </h3>
        <p className="text-xs line-clamp-1">{podcast.podcast_description}</p>
      </div>
      <div className="flex-grow" />
      <div className="flex flex-row items-center text-xs justify-center gap-2">
        <div className="flex flex-row items-center justify-center gap-1">
          <FaPlay className="text-xs text-gray-500" />
          {podcast.view_count || 0}
        </div>
        <FaCircle className="text-[4px] text-gray-500" />
        <div className="flex flex-row items-center justify-center gap-1">
          <FaThumbsUp className="text-xs text-gray-500" />
          {podcast.like_count || 0}
        </div>
        <FaCircle className="text-[4px] text-gray-500" />
        <div className="flex flex-row items-center justify-center gap-1">
          <FaThumbsDown className="text-xs text-gray-500" />
          {podcast.dislike_count || 0}
        </div>
      </div>
      <div className="text-xs font-semibold">
        {formatDuration(podcast.duration)}
      </div>
    </div>
  );
};
