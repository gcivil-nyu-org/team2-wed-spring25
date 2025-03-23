function truncateFilenameWithEllipsis(filename, maxLength) {
  // Split the filename into name and extension
  if (!filename) return "";
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename; // Get the name part
  const extension = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : ""; // Get the extension part

  // Truncate the name if it exceeds maxLength
  if (name.length > maxLength) {
    const truncatedName = name.slice(0, maxLength) + "...";
    return truncatedName + extension; // Reattach the extension
  }

  // If no truncation is needed, return the original filename
  return filename;
}

function getUserFullName(firstname, lastname) {
  return `${firstname} ${lastname}`
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
export { truncateFilenameWithEllipsis, getUserFullName };
