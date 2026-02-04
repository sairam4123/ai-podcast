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
            {/* Bottom nav bar */}
            <div className="bg-surface/95 backdrop-blur-xl border-t border-tertiary/20 safe-area-bottom shadow-lg shadow-black/20">
                <div className="flex items-center justify-around px-2 py-1.5">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const isProfile = item.label === "Profile";

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavClick(item)}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]",
                                    active
                                        ? "text-primary bg-primary/10"
                                        : "text-tertiary hover:text-tertiary-foreground active:text-tertiary-foreground"
                                )}
                            >
                                {isProfile && userId ? (
                                    <ProfileAvatarIcon
                                        imageUrl={imageUrl}
                                        id={userId}
                                        className={cn(
                                            "w-5 h-5 flex-shrink-0 transition-all",
                                            active && "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-surface rounded-full"
                                        )}
                                        imageClassName="w-5 h-5 rounded-full object-cover"
                                    />
                                ) : (
                                    <item.icon className={cn(
                                        "text-xl transition-transform",
                                        active && "scale-105"
                                    )} />
                                )}
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    active ? "text-primary" : "text-tertiary"
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
