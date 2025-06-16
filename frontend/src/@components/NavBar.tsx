import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { CreatePodcastModal } from "../modals/CreatePodcast";
import { SearchBox } from "./SearchBox";

export function NavBar() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return <nav>
        <ul className="flex text-base flex-row items-center space-x-4 p-4 from-sky-700/50 shadow-black/30 shadow-lg to-blue-700/50 bg-linear-330 text-white">
            <li className="font-black text-3xl text-shadow-md"><a href="/">Podolli.AI</a></li>
            <li className="flex-grow text-base flex justify-center">
                <SearchBox variant="xl" />
            </li>
            <li 
            onClick={() => {
                setIsCreateModalOpen(true);
            }}
            className="bg-sky-300 cursor-pointer hover:bg-sky-200 transition-all duration-100 ease-out text-center flex flex-row items-center justify-center gap-2 p-3 mr-4 rounded-full text-black">
                <FaPlus className="text-lg" />
                Create
            </li>
            {/* <li className=""><a href="/podcasts">Explore</a></li>
            <li className=""><a href="/podcasts">Pricing</a></li> */}
            <li className="">
                <a className="text-gray-200 hover:text-white transition-colors">
                    Sign&nbsp;In
                </a>
            </li>
        </ul>
        <CreatePodcastModal isOpen={isCreateModalOpen} onClose={() => {
            setIsCreateModalOpen(false);
        }} onCreate={(data) => {
            console.log("Podcast created", data);
            setIsCreateModalOpen(false);
        }}/>
    </nav>
}