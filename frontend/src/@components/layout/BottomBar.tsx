import { useEffect, useState } from "react";
import { FaHome, FaPlus, FaSearch, FaUser, FaMusic } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router";
import { cn } from "../../lib/cn";
import { getUser } from "../../lib/supabase";
import { useGetAvatarImage } from "../../api/getAvatarImage";
import { ProfileAvatarIcon } from "../../@components/AvatarIcon";

interface NavItem {
    icon: typeof FaHome;
    label: string;
    path: string;
    isDynamic?: boolean;
}

const navItems: NavItem[] = [
    { icon: FaHome, label: "Home", path: "/" },
    { icon: FaSearch, label: "Search", path: "/search" },
    { icon: FaPlus, label: "Create", path: "/create" },
    { icon: FaMusic, label: "Library", path: "/library" },
    { icon: FaUser, label: "Profile", path: "/profile", isDynamic: true },
];

export function BottomBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        getUser().then((user) => {
            if (user) setUserId(user.id);
        });
    }, []);

    const { imageUrl } = useGetAvatarImage({
        personId: userId ?? "",
    });

    const handleNavClick = (item: NavItem) => {
        if (item.isDynamic && item.label === "Profile") {
            if (userId) {
                navigate(`/user/${userId}`);
            } else {
                navigate("/login");
            }
        } else {
            navigate(item.path);
        }
    };

    const isActive = (item: NavItem) => {
        if (item.isDynamic && item.label === "Profile") {
            return location.pathname.startsWith("/user/");
        }
        return location.pathname === item.path;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
            {/* Branding header for mobile */}
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/90 backdrop-blur-md border border-cyan-500/20">
                    <img src="/logo.png" alt="Podolli.AI" className="h-5 w-5 object-contain" />
                    <span className="font-heading text-sm font-bold text-white">Podolli.AI</span>
                </div>
            </div>

            {/* Bottom nav bar */}
            <div className="bg-cyan-950/95 backdrop-blur-xl border-t border-cyan-500/20 safe-area-bottom">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const isProfile = item.label === "Profile";

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavClick(item)}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[56px]",
                                    active
                                        ? "text-cyan-400"
                                        : "text-cyan-200/60 active:text-white"
                                )}
                            >
                                {isProfile && userId ? (
                                    <ProfileAvatarIcon
                                        imageUrl={imageUrl}
                                        id={userId}
                                        className={cn(
                                            "w-6 h-6 flex-shrink-0",
                                            active && "scale-110 ring-2 ring-cyan-500/50 rounded-full"
                                        )}
                                        imageClassName="w-6 h-6 rounded-full object-cover border border-cyan-500/30"
                                    />
                                ) : (
                                    <item.icon className={cn(
                                        "text-xl transition-transform",
                                        active && "scale-110"
                                    )} />
                                )}
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    active ? "text-cyan-400" : "text-cyan-200/60"
                                )}>
                                    {isProfile && !userId ? "Sign In" : item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
