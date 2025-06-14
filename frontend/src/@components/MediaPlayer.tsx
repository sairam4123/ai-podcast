import { useMediaPlayerContext } from "../contexts/mediaPlayer.context";

export function MediaPlayer() {
    const {sourceUrl, setSourceUrl} = useMediaPlayerContext();
    return (
        <div className="fixed bottom-0 left-0 w-full bg-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <button onClick={() => setSourceUrl("")} className="text-white">Stop</button>
                <audio controls src={sourceUrl} className="w-full" />
            </div>
            <div className="text-white">
                Now Playing: {sourceUrl ? sourceUrl.split('/').pop() : "Nothing"}
            </div>
            <div className="flex items-center space-x-4">
                <button className="text-white">Next</button>
                <button className="text-white">Previous</button>
            </div>
        </div>
    );
}