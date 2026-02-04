import { api } from "../api/api";
import { NavBar } from "../@components/NavBar";
import PodcastCardSkeleton, { PodcastCard } from "../@components/PodcastCard";
import PodcastFeaturedCard, {
  PodcastFeaturedCardSkeleton,
} from "../@components/PodcastFeaturedCard";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-semibold text-white px-1">
        {title}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {children}
      </div>
    </section>
  );
}

export function Home() {
  const { data, error, isLoading } = api.useGetAllPodcast({
    limit: 10,
    offset: 0,
  });

  const {
    data: featuredData,
    error: featuredError,
    isLoading: featuredIsLoading,
  } = api.useGetFeaturedPodcasts({
    limit: 5,
    offset: 0,
  });

  const {
    data: trendingData,
    error: trendingError,
    isLoading: trendingIsLoading,
  } = api.useGetTrendingPodcasts({
    limit: 5,
    offset: 0,
  });

  const {
    data: recommendationsData,
    error: recommendationsError,
    isLoading: recommendationsIsLoading,
  } = api.useGetRecommendations();

  return (
    <main className="min-h-screen pb-32">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* For You */}
        <Section title="For You">
          {recommendationsData?.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
          {recommendationsIsLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <PodcastCardSkeleton key={i} />
            ))}
          {recommendationsError && (
            <p className="text-red-400 text-sm">
              Error: {recommendationsError.message}
            </p>
          )}
        </Section>

        {/* Recently Added */}
        <Section title="Recently Added">
          {data?.results?.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <PodcastCardSkeleton key={i} />
            ))}
          {error && (
            <p className="text-red-400 text-sm">Error: {error.message}</p>
          )}
        </Section>

        {/* Trending */}
        <Section title="Trending">
          {trendingData?.results.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
          {trendingIsLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <PodcastCardSkeleton key={i} />
            ))}
          {trendingError && (
            <p className="text-red-400 text-sm">
              Error: {trendingError.message}
            </p>
          )}
        </Section>

        {/* Featured */}
        <Section title="Featured">
          {featuredData?.results.map((podcast) => (
            <PodcastFeaturedCard key={podcast.id} podcast={podcast} />
          ))}
          {featuredIsLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <PodcastFeaturedCardSkeleton key={i} />
            ))}
          {featuredError && (
            <p className="text-red-400 text-sm">
              Error: {featuredError.message}
            </p>
          )}
        </Section>
      </div>
    </main>
  );
}
