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
                    <label className="text-sm font-medium text-tertiary">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={cn(
                        "w-full px-4 py-2.5 rounded-lg bg-surface border border-tertiary/20 text-tertiary-foreground placeholder-tertiary/50 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none",
                        error && "border-rose-500 focus:border-rose-500",
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-rose-500">{error}</p>}
            </div>
        );
    }
);

TextArea.displayName = "TextArea";
