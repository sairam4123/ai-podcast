import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/cn';

interface MarkdownProps {
    content: string;
    className?: string;
    highlighting?: {
        startTime: number;
        endTime: number;
        currentPosition: number;
        isPlaying: boolean;
        isCurrent: boolean;
    };
}

/**
 * A custom rehype plugin to split text nodes into indexed spans for highlighting.
 * The options object must be mutable to allow resetting the count.
 */
const rehypeHighlightWords = (options: { count: number }) => {
    return (tree: any) => {
        options.count = 0; // Reset counter for this pass, ensuring synchronicity

        const visit = (node: any, parent: any, index: number) => {
            if (node.type === 'text') {
                const value = node.value as string;
                // Split by whitespace, capturing separators to reconstruct if needed or at least handle words separately
                const parts = value.split(/(\s+)/);
                const newNodes: any[] = [];

                parts.forEach((part) => {
                    if (!part) return;
                    if (part.match(/^\s+$/)) {
                        // Preserve whitespace as text node
                        newNodes.push({ type: 'text', value: part });
                    } else {
                        // It's a word
                        newNodes.push({
                            type: 'element',
                            tagName: 'span',
                            properties: {
                                className: ['md-word'],
                                'data-index': options.count++
                            },
                            children: [{ type: 'text', value: part }]
                        });
                    }
                });

                if (newNodes.length > 0 && parent && typeof index === 'number') {
                    parent.children.splice(index, 1, ...newNodes);
                    return index + newNodes.length;
                }
            }

            if (node.children) {
                let i = 0;
                while (i < node.children.length) {
                    const child = node.children[i];
                    const nextIndex = visit(child, node, i);
                    if (nextIndex !== undefined) {
                        i = nextIndex;
                    } else {
                        i++;
                    }
                }
            }
            return undefined;
        };

        visit(tree, null, 0);
    };
};

export function Markdown({ content, className, highlighting }: MarkdownProps) {
    // Calculate word duration if highlighting is active
    const { wordDuration } = useMemo(() => {
        if (!highlighting) return { wordDuration: 0 };
        // Estimate total words using same regex as plugin
        const parts = content.split(/(\s+)/);
        const words = parts.filter(p => p && !p.match(/^\s+$/));
        const count = words.length;
        const duration = highlighting.endTime - highlighting.startTime;
        return {
            wordDuration: count > 0 ? duration / count : 0
        };
    }, [content, highlighting?.startTime, highlighting?.endTime]);

    const components = useMemo(() => {
        if (!highlighting) return {}; // Default components

        return {
            span: ({ node, className, children, ...props }: any) => {
                // Check if it's our injected span
                const dataIndex = node?.properties?.['data-index'] ?? props['data-index'];

                if (className?.includes('md-word') && dataIndex !== undefined) {
                    const index = Number(dataIndex);

                    // Highlighting Logic
                    const wordStart = highlighting.startTime + index * wordDuration;
                    const wordEnd = wordStart + wordDuration;
                    const { currentPosition, isPlaying, isCurrent } = highlighting;

                    const isCurrentWord = isPlaying && isCurrent && currentPosition >= wordStart && currentPosition < wordEnd;
                    const isFuture = isPlaying && isCurrent && currentPosition < wordStart;

                    const opacityClass = isCurrent
                        ? (isFuture ? "opacity-50 blur-[0.3px] transition-all duration-300" : "opacity-100")
                        : "opacity-100";

                    return (
                        <span
                            className={cn(
                                "inline-block transition-all duration-200 rounded px-0.5",
                                opacityClass,
                                isCurrentWord && "text-white font-medium scale-105",
                                className
                            )}
                            {...props}
                        >
                            {children}
                        </span>
                    );
                }
                return <span className={className} {...props}>{children}</span>;
            }
        };
    }, [highlighting, wordDuration]);

    // Stable reference for the plugin config
    const stableRehypePlugins = useMemo(() => {
        if (!highlighting) return [];
        return [[rehypeHighlightWords, { count: 0 }]];
    }, [highlighting?.startTime]);

    return (
        <div className={cn("prose prose-invert prose-p:leading-7 prose-p:mb-2 max-w-none prose-p:text-inherit prose-headings:text-inherit prose-strong:text-inherit", className)}>
            <ReactMarkdown
                rehypePlugins={stableRehypePlugins as any}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
