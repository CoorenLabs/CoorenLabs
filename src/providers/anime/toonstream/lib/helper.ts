export const isTooLarge = (contentLength: string | null, limit: number) => {
    return contentLength && parseInt(contentLength, 10) > limit;
};