import React, { TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ className, containerClassName, label, error, ...props }, ref) => {
        return (
            <div className={cn("flex flex-col gap-1.5", containerClassName)}>
                {label && (
                    <label className="text-sm font-medium text-cyan-300">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={cn(
                        "w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none",
                        error && "border-red-500 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

TextArea.displayName = "TextArea";
