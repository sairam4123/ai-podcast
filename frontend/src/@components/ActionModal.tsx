import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    children?: React.ReactNode | React.ReactNode[];
}

const ActionModal: React.FC<ActionModalProps> = ({
    isOpen,
    title,
    description,
    onClose,
    children
}) => {
    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white flex flex-col min-w-96 rounded-lg shadow-lg p-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                        {description && <p className="mt-2 text-sm text-gray-600 py-2">{description}</p>}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body // Render the modal into the body element
    );
};

interface ActionRowProps {
    buttons: React.ReactElement<HTMLButtonElement>[];
}

export const ActionModalActionRow: React.FC<ActionRowProps> = ({ buttons }) => {
    return <div className="flex justify-end space-x-3">{
        buttons.map(button => button) 
    }</div>;
};

export default ActionModal;