import { FaHome, FaHeadphones } from "react-icons/fa";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            {/* Animated 404 */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative mb-8"
            >
                <h1 className="text-[120px] md:text-[180px] font-heading font-bold bg-gradient-to-br from-tertiary-foreground via-primary to-tertiary bg-clip-text text-transparent leading-none">
                    404
                </h1>
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    <FaHeadphones className="text-6xl md:text-8xl text-tertiary/20" />
                </motion.div>
            </motion.div>

            {/* Message */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 mb-8"
            >
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-tertiary-foreground">
                    Page Not Found
                </h2>
                <p className="text-tertiary max-w-md mx-auto">
                    Oops! The page you're looking for doesn't exist or has been moved.
                    Let's get you back to discovering amazing podcasts.
                </p>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    <FaHome />
                    Go Home
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 rounded-full bg-surface border border-tertiary/20 text-tertiary hover:bg-surface-highlight hover:text-tertiary-foreground font-medium transition-all"
                >
                    Go Back
                </button>
            </motion.div>

            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
