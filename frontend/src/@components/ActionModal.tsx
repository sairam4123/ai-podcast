import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';

interface ActionModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    children?: React.ReactNode | React.ReactNode[];
    className?: string;
}

const ActionModal: React.FC<ActionModalProps> = ({
    isOpen,
    title,
    description,
    onClose,
    children,
    className
}) => {
    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "relative w-full max-w-lg glass-panel p-6 shadow-2xl overflow-hidden",
                            className
                        )}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="mb-6">
                            <h2 className="font-heading text-xl font-bold text-white mb-1.5">{title}</h2>
                            {description && <p className="text-sm text-slate-400 leading-relaxed">{description}</p>}
                        </div>

                        <div className="space-y-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

interface ActionRowProps {
    buttons: React.ReactElement<HTMLButtonElement>[];
    className?: string;
}

export const ActionModalActionRow: React.FC<ActionRowProps> = ({ buttons, className }) => {
    return <div className={cn("flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10", className)}>
        {buttons.map((button, idx) => React.cloneElement(button, { key: idx }))}
    </div>;
};

export default ActionModal;