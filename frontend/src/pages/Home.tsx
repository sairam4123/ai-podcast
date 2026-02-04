import { api } from "../api/api";
import PodcastCardSkeleton, { PodcastCard } from "../@components/PodcastCard";
import PodcastFeaturedCard, {
  PodcastFeaturedCardSkeleton,
} from "../@components/PodcastFeaturedCard";

// Grid-based Section for multi-column layout
function GridSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-tertiary-foreground">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {children}
      </div>
    </section>
  );
}

export function Home() {
  const { data, error, isLoading } = api.useGetAllPodcast({
    limit: 12,
    offset: 0,
  });

  const {
    data: featuredData,
    error: featuredError,
    isLoading: featuredIsLoading,
  } = api.useGetFeaturedPodcasts({
    limit: 4,
    offset: 0,
  });

  const {
    data: trendingData,
    error: trendingError,
    isLoading: trendingIsLoading,
  } = api.useGetTrendingPodcasts({
    limit: 6,
    offset: 0,
  });

  const {
    data: recommendationsData,
    error: recommendationsError,
    isLoading: recommendationsIsLoading,
  } = api.useGetRecommendations();

  return (
    <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-8 space-y-12">
      {/* Featured Hero Section - Grid layout */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-tertiary-foreground">Featured</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {featuredData?.results.map((podcast) => (
            <PodcastFeaturedCard key={podcast.id} podcast={podcast} />
          ))}
          {featuredIsLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <PodcastFeaturedCardSkeleton key={i} />
            ))}
          {featuredError && (
            <p className="text-rose-400 text-sm col-span-full">
              Error: {featuredError.message}
            </p>
          )}
        </div>
      </section>

      {/* For You - Grid layout */}
      <GridSection title="For You">
        {recommendationsData?.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} />
        ))}
        {recommendationsIsLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <PodcastCardSkeleton key={i} />
          ))}
        {recommendationsError && (
          <p className="text-rose-400 text-sm col-span-full">
            Error: {recommendationsError.message}
          </p>
        )}
      </GridSection>

      {/* Trending - Grid layout */}
      <GridSection title="Trending">
        {trendingData?.results.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} />
        ))}
        {trendingIsLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <PodcastCardSkeleton key={i} />
          ))}
        {trendingError && (
          <p className="text-rose-400 text-sm col-span-full">
            Error: {trendingError.message}
          </p>
        )}
      </GridSection>

      {/* Recently Added - Grid layout */}
      <GridSection title="Recently Added">
        {data?.results?.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} />
        ))}
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <PodcastCardSkeleton key={i} />
          ))}
        {error && (
          <p className="text-rose-400 text-sm col-span-full">
            Error: {error.message}
          </p>
        )}
      </GridSection>
    </div>
  );
}
