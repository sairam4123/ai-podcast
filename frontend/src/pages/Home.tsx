import { api } from "../api/api"
import { NavBar } from "../@components/NavBar"
import PodcastCardSkeleton, { PodcastCard } from "../@components/PodcastCard"
import PodcastFeaturedCard, { PodcastFeaturedCardSkeleton } from "../@components/PodcastFeaturedCard"

export function Home() {

    const {data, error, isLoading} = api.useGetAllPodcast({
        limit: 10,
        offset: 0,
    })

    const { data:featuredData, error:featuredError, isLoading: featuredIsLoading } = api.useGetFeaturedPodcasts({
        limit: 5,
        offset: 0,
    })

    const {data:trendingData, error:trendingError, isLoading: trendingIsLoading} = api.useGetTrendingPodcasts({
        limit: 5,
        offset: 0,
    })

    return <main className="flex flex-col min-h-screen bg-radial pb-32 from-sky-950 to-black">
    <NavBar />
    <div className="flex flex-col flex-grow gap-4 p-4">
        <div className="flex flex-col bg-sky-800/20 border border-sky-600/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
                For you
            </p>
            <div className="flex flex-row space-x-2 overflow-auto">
                {data?.results.map((podcast) => {
                    return <PodcastCard key={podcast.id} podcast={podcast} />
                })}
                {
                    isLoading && Array.from({ length: 6 }).map((_, index) => (
                        <PodcastCardSkeleton key={index} />
                    ))
                }
                {
                    error && <div className="text-red-500 text-center w-full">Error loading podcasts: {error.message}</div>
                }
                {/* <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard />
                <PodcastCard /> */}
            </div>
        </div>
        <div className="flex flex-col bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
                Trending
            </p>
            <div className="flex flex-row space-x-2 overflow-auto">
                {trendingData?.results.map((podcast) => {
                    return <PodcastCard key={podcast.id} podcast={podcast} />
                })}
                {
                    trendingIsLoading && Array.from({ length: 5 }).map((_, index) => (
                        <PodcastCardSkeleton key={index} />
                    ))
                }
                {
                    trendingError && <div className="text-red-500 text-center w-full">Error loading trending podcasts: {trendingError.message}</div>
                }

            </div>
        </div>
        <div className="flex flex-col bg-sky-500/20 border border-sky-300/50 space-y-2 p-2 rounded-lg">
            <p className="text-2xl ml-4 mt-2 font-black text-shadow-md text-white">
                Featured
            </p>
            <div className="flex flex-row space-x-2 overflow-auto">
                {featuredData?.results.map((podcast) => {
                    return <PodcastFeaturedCard key={podcast.id} podcast={podcast} />
                })}
                {
                    featuredIsLoading && Array.from({ length: 5 }).map((_, index) => (
                        <PodcastFeaturedCardSkeleton key={index} />
                    ))
                }
                {
                    featuredError && <div className="text-red-500 text-center w-full">Error loading featured podcasts: {featuredError.message}</div>
                }
            </div>
        </div>
    </div>
    </main>
}

