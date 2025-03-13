function truncateFilenameWithEllipsis(filename, maxLength) {
    // Split the filename into name and extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename; // Get the name part
    const extension = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : ''; // Get the extension part

    // Truncate the name if it exceeds maxLength
    if (name.length > maxLength) {
        const truncatedName = name.slice(0, maxLength) + '...';
        return truncatedName + extension; // Reattach the extension
    }

    // If no truncation is needed, return the original filename
    return filename;
}

export { truncateFilenameWithEllipsis };