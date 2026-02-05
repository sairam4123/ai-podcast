// This file contains the API URL for the frontend application.
// It is used to make requests to the backend server.
// The URL is set to the backend server's address and port.

import { useAutoFillPodcastForm } from "./autoFillPodcast";
import { useGeneratePodcast } from "./generatePodcast";
import { useGetAllPodcast } from "./getAllPodcast";
import { useGetAudio } from "./getAudio";
import { useGetAvatarImage } from "./getAvatarImage";
import { useGetConversation } from "./getConversation";
import { useGetFeaturedPodcasts } from "./getFeaturedPodcasts";
import { useGetImage } from "./getImage";
import { useGetPodcast } from "./getPodcast";
import { useGetQueue } from "./getQueue";
import { useGetTrendingPodcasts } from "./getTrendingPodcasts";
import { useSearchPodcast } from "./searchPodcasts";
import { useUpdatePodcastVisibility } from "./updatePodcastVisibility";
import { useGetListenHistory } from "./getListenHistory";
import { useGetRecommendations } from "./getRecommendations";
import { useLikePodcast } from "./likePodcast";
import { useDislikePodcast } from "./dislikePodcast";
import { useGetLikedPodcasts } from "./getLikedPodcasts";

import useUserLogin from "./userLogin";
import useUserRegister from "./userRegister";
import useGetUserProfile from "./getUserProfile";
import useSendLiveQuestion from "./sendLiveQuestion";
import useGetPodcastQuestions from "./getPodcastQuestions";

// check if the environment is hosted on localhost or local network
// ?
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const isLocalNetwork =
  window.location.hostname.startsWith("192.168.") ||
  window.location.hostname.startsWith("10.") ||
  window.location.hostname.startsWith("172.");
// console.log("isLocalhost", isLocalhost);
// console.log("isLocalNetwork", isLocalNetwork);
// console.log("window.location.hostname", window.location.hostname);

const VITE_API_URL = import.meta.env.VITE_APP_API_URL;

export const API_URL = VITE_API_URL
  ? VITE_API_URL
  : `http${isLocalhost || isLocalNetwork ? "" : "s"}://${window.location.hostname
  }:8000/api`;

export const api = {
  useSearchPodcast,
  useGetListenHistory,
  useGetRecommendations,
  useGetAllPodcast,
  useGeneratePodcast,
  useGetAudio,
  useGetAvatarImage,
  useGetImage,
  useGetPodcast,
  useGetQueue,
  useGetConversation,
  useGetFeaturedPodcasts,
  useGetTrendingPodcasts,
  useGetUserProfile,
  useUserLogin,
  useUserRegister,
  useAutoFillPodcastForm,
  useUpdatePodcastVisibility,
  useLikePodcast,
  useDislikePodcast,
  useSendLiveQuestion,
  useGetPodcastQuestions,
  useGetLikedPodcasts,
};
