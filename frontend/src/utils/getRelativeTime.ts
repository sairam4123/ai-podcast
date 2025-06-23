export function getRelativeTime(dateString: string | null) {
    if (!dateString) return 'unknown time';
    const now = new Date();
    const date = new Date(dateString + "Z"); // assuming UTC string from DB 
    const diff = (now.getTime() - date.getTime()) / 1000; // in seconds

    const times = [
        { unit: 'year', seconds: 31536000 },
        { unit: 'month', seconds: 2592000 },
        { unit: 'week', seconds: 604800 },
        { unit: 'day', seconds: 86400 },
        { unit: 'hour', seconds: 3600 },
        { unit: 'minute', seconds: 60 },
        { unit: 'second', seconds: 1 },
    ];

    for (const t of times) {
        const delta = Math.floor(diff / t.seconds);
        if (delta >= 1) {
            return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-delta, t.unit as Intl.RelativeTimeFormatUnit);
        }
    }

    return 'just now';
}
