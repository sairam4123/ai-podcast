import { useEffect, useState } from "react";
import { FaHome, FaPlus, FaSearch, FaUser, FaMusic, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { getUser, supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { api } from "../../api/api";
import { useGetAvatarImage } from "../../api/getAvatarImage";
import { ProfileAvatarIcon } from "../../@components/AvatarIcon";

interface NavItem {
    icon: typeof FaHome;
    label: string;
    path: string;
}

const navItems: NavItem[] = [
    { icon: FaHome, label: "Home", path: "/" },
    { icon: FaSearch, label: "Search", path: "/search" },
    { icon: FaPlus, label: "Create", path: "/create" },
    { icon: FaMusic, label: "Library", path: "/library" },
];

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        getUser().then((user) => {
            if (user) setUserId(user.id);
        });
    }, []);

    const { data: userProfile } = api.useGetUserProfile({
        userId: userId ?? "",
    });

    const { imageUrl } = useGetAvatarImage({
        personId: userId ?? "",
    });

    const handleProfileClick = () => {
        if (userId) {
            navigate(`/user/${userId}`);
        } else {
            navigate("/login");
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error("Failed to logout");
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface/50 backdrop-blur-md border-r border-tertiary/10">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 p-6 border-b border-tertiary/10">
                <a
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/");
                    }}
                    href="/"
                    className="flex items-center gap-3 group"
                >
                    <img src="/logo.png" alt="Podolli.AI" className="h-8 w-8 object-contain opacity-90 transition-transform group-hover:scale-105" />
                    <span className="font-heading text-lg font-bold text-tertiary-foreground tracking-tight">
                        Podolli.AI
                    </span>
                </a>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 mt-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <motion.button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            className={cn(
                                "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-secondary text-secondary-foreground shadow-sm"
                                    : "text-tertiary hover:bg-surface-highlight hover:text-primary"
                            )}
                        >
                            <item.icon className={cn(
                                "text-lg flex-shrink-0 transition-colors",
                                isActive ? "text-primary" : "text-tertiary"
                            )} />
                            <span className={cn(
                                "font-medium text-sm",
                                isActive && "text-white"
                            )}>
                                {item.label}
                            </span>
                        </motion.button>
                    );
                })}
            </nav>

            {/* Bottom Section - Profile, Settings, Logout */}
            <div className="p-3 border-t border-tertiary/10 space-y-1 mb-2">
                <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-tertiary hover:bg-surface-highlight hover:text-primary transition-all text-left"
                >
                    {userId ? (
                        <>
                            <ProfileAvatarIcon
                                imageUrl={imageUrl}
                                id={userId}
                                className="w-5 h-5 flex-shrink-0"
                                imageClassName="w-5 h-5 rounded-full object-cover ring-1 ring-tertiary/30"
                            />
                            <span className="font-medium text-sm line-clamp-1 flex-1">
                                {userProfile?.user?.display_name || "Profile"}
                            </span>
                        </>
                    ) : (
                        <>
                            <FaUser className="text-lg flex-shrink-0 text-tertiary" />
                            <span className="font-medium text-sm">Sign In</span>
                        </>
                    )}
                </button>
                <button
                    onClick={() => navigate("/settings")}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-tertiary hover:bg-surface-highlight hover:text-primary transition-all"
                >
                    <FaCog className="text-lg flex-shrink-0 text-tertiary" />
                    <span className="font-medium text-sm">Settings</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                >
                    <FaSignOutAlt className="text-lg flex-shrink-0" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
}
