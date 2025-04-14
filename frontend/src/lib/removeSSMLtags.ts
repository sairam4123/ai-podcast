export function removeSSMLtags(text: string): string {
    // Remove SSML tags using regex
    return text.replace(/<[^>]+>/g, "");
}