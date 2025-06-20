// This file contains the API URL for the frontend application.
// It is used to make requests to the backend server.
// The URL is set to the backend server's address and port.

import { useGeneratePodcast } from "./generatePodcast";
import { useGetAllPodcast } from "./getAllPodcast";
import { useGetAudio } from "./getAudio";
import { useGetAvatarImage } from "./getAvatarImage";
import { useGetConversation } from "./getConversation";
import { useGetImage } from "./getImage";
import { useGetPodcast } from "./getPodcast";
import { useGetQueue } from "./getQueue";
import useGetUserProfile from "./getUserProfile";
import { useSearchPodcast } from "./searchPodcasts";

// check if the environment is hosted on localhost or local network
// ?
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const isLocalNetwork = window.location.hostname.startsWith("192.168.") || window.location.hostname.startsWith("10.") || window.location.hostname.startsWith("172.");
console.log("isLocalhost", isLocalhost);
console.log("isLocalNetwork", isLocalNetwork);
console.log("window.location.hostname", window.location.hostname);

export const API_URL = `http${isLocalhost || isLocalNetwork ? '' : 's'}://${window.location.hostname}:8000`;

export const api = {
    useSearchPodcast,
    useGetAllPodcast,
    useGeneratePodcast,
    useGetAudio,
    useGetAvatarImage,
    useGetImage,
    useGetPodcast,
    useGetUserProfile,
    useGetQueue,
    useGetConversation,
}