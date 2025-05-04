// This file contains the API URL for the frontend application.
// It is used to make requests to the backend server.
// The URL is set to the backend server's address and port.

// check if the environment is hosted on localhost or local network
// ?
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const isLocalNetwork = window.location.hostname.startsWith("192.168.") || window.location.hostname.startsWith("10.") || window.location.hostname.startsWith("172.");
console.log("isLocalhost", isLocalhost);
console.log("isLocalNetwork", isLocalNetwork);
console.log("window.location.hostname", window.location.hostname);
export const API_URL = `http://${window.location.hostname}:8000`;