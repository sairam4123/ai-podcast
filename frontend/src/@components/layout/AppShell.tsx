import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomBar } from "./BottomBar";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { MediaPlayer } from "../MediaPlayer";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const isMobile = useIsMobile();

    return (
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-background">
            {/* Desktop Sidebar - Fixed, never scrolls */}
            {!isMobile && (
                <aside className="hidden lg:flex flex-col w-64 h-full flex-shrink-0 border-r border-tertiary/20 overflow-y-auto bg-surface">
                    <Sidebar />
                </aside>
            )}

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-28">
                {children}
            </main>

            {/* Mobile Bottom Bar - Fixed */}
            {isMobile && <BottomBar />}

            {/* Media Player - Fixed at bottom */}
            <MediaPlayer />
        </div>
    );
}

// Re-export for backwards compatibility
export function useAppShell() {
    return {
        sidebarOpen: true,
        setSidebarOpen: () => { },
        toggleSidebar: () => { },
    };
}
