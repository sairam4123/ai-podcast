import { useNavigate } from "react-router";

export function TopBar() {
    const navigate = useNavigate();

    return (
        <div className="sticky top-0 left-0 right-0 z-40 lg:hidden bg-surface/90 backdrop-blur-md border-b border-tertiary/20 safe-area-top shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
                <a
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/");
                    }}
                    href="/"
                    className="flex items-center gap-2 group"
                >
                    <img
                        src="/logo.png"
                        alt="Podolli.AI"
                        className="h-8 w-8 object-contain transition-transform group-hover:scale-110"
                    />
                    <span className="font-heading text-lg font-bold text-tertiary-foreground tracking-tight">
                        Podolli.AI
                    </span>
                </a>
            </div>
        </div>
    );
}
