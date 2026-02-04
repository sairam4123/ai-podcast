import { useEffect, useState } from "react";
import { FaHome, FaPlus, FaSearch, FaUser, FaMusic, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router";
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
    { icon: FaPlus, label: "Create", path: "/create" },
    { icon: FaSearch, label: "Search", path: "/search" },
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
        <div className="flex flex-col h-full bg-background border-r border-tertiary/10">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 p-5 mb-2">
                <a
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/");
                    }}
                    href="/"
                    className="flex items-center gap-3 group"
                >
                    <img src="/logo.png" alt="Podolli.AI" className="h-6 w-6 object-contain opacity-90" />
                    <span className="font-heading text-lg font-bold text-tertiary-foreground tracking-tight">
                        Podolli.ai
                    </span>
                </a>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                                isActive
                                    ? "bg-surface-highlight text-white"
                                    : "text-tertiary hover:text-tertiary-foreground hover:bg-surface-highlight/50"
                            )}
                        >
                            <item.icon className={cn(
                                "text-sm flex-shrink-0",
                                isActive ? "text-primary" : "text-tertiary group-hover:text-tertiary-foreground"
                            )} />
                            <span>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section - Profile, Settings, Logout */}
            <div className="p-3 border-t border-tertiary/10 space-y-0.5">
                <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-tertiary hover:text-tertiary-foreground hover:bg-surface-highlight/50 transition-all text-left group"
                >
                    {userId ? (
                        <>
                            <ProfileAvatarIcon
                                imageUrl={imageUrl}
                                id={userId}
                                className="w-5 h-5 flex-shrink-0"
                                imageClassName="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-medium text-sm line-clamp-1 flex-1">
                                {userProfile?.user?.display_name || "Profile"}
                            </span>
                        </>
                    ) : (
                        <>
                            <FaUser className="text-sm flex-shrink-0 text-tertiary" />
                            <span className="font-medium text-sm">Sign In</span>
                        </>
                    )}
                </button>
                <button
                    onClick={() => navigate("/settings")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-tertiary hover:text-tertiary-foreground hover:bg-surface-highlight/50 transition-all text-sm font-medium"
                >
                    <FaCog className="text-sm flex-shrink-0 text-tertiary" />
                    <span>Settings</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-all text-sm font-medium"
                >
                    <FaSignOutAlt className="text-sm flex-shrink-0" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
