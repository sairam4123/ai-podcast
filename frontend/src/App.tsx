import { Home } from "./pages/Home";
import { Toaster } from "react-hot-toast";

import { BrowserRouter, Route, Routes } from "react-router";
import { MediaPlayerProvider } from "./contexts/mediaPlayer.context";
import { PodcastProvider } from "./contexts/podcast.context";
import { PodcastNew } from "./pages/PodcastNew";
import Login from "./pages/Login";
import Create from "./pages/Create";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import { AnalyticsProvider } from "./contexts/analytics.context";
import { AppShell } from "./@components/layout/AppShell";

// Layout wrapper for protected/main pages
function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export function App() {
  return (
    <PodcastProvider>
      <MediaPlayerProvider>
        <AnalyticsProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth pages - no AppShell */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Main app pages - with AppShell */}
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Home />
                  </MainLayout>
                }
              />
              <Route
                path="/create"
                element={
                  <MainLayout>
                    <Create />
                  </MainLayout>
                }
              />
              <Route
                path="/podcast/:podcast_id"
                element={
                  <MainLayout>
                    <PodcastNew />
                  </MainLayout>
                }
              />
              <Route
                path="/user/:user_id"
                element={
                  <MainLayout>
                    <UserProfile />
                  </MainLayout>
                }
              />
              <Route
                path="/search"
                element={
                  <MainLayout>
                    <Search />
                  </MainLayout>
                }
              />

              {/* 404 Catch-all */}
              <Route
                path="*"
                element={
                  <MainLayout>
                    <NotFound />
                  </MainLayout>
                }
              />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AnalyticsProvider>
      </MediaPlayerProvider>
    </PodcastProvider>
  );
}

