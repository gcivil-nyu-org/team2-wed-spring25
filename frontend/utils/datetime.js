export default function formatDateAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000); // Difference in seconds

  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  // Calculate the difference in years, months, days, etc.
  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < intervals.hour) {
    const minutes = Math.floor(diffInSeconds / intervals.minute);
    return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;
  } else if (diffInSeconds < intervals.day) {
    const hours = Math.floor(diffInSeconds / intervals.hour);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else if (diffInSeconds < intervals.month) {
    const days = Math.floor(diffInSeconds / intervals.day);
    if (days === 1) return "yesterday";
    return days === 0 ? "today" : `${days} days ago`;
  } else if (diffInSeconds < intervals.year) {
    const months = Math.floor(diffInSeconds / intervals.month);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  } else {
    const years = Math.floor(diffInSeconds / intervals.year);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
}

export function formatDateAgoShort(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000); // Difference in seconds

  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  // Calculate the difference in years, months, days, etc.
  if (diffInSeconds < 60) {
    return "now";
  } else if (diffInSeconds < intervals.hour) {
    const minutes = Math.floor(diffInSeconds / intervals.minute);
    return `${minutes}m`;
  } else if (diffInSeconds < intervals.day) {
    const hours = Math.floor(diffInSeconds / intervals.hour);
    return `${hours}h`;
  } else if (diffInSeconds < intervals.month) {
    const days = Math.floor(diffInSeconds / intervals.day);
    return `${days}d`;
  } else if (diffInSeconds < intervals.year) {
    const months = Math.floor(diffInSeconds / intervals.month);
    return `${months}mo`;
  } else {
    const years = Math.floor(diffInSeconds / intervals.year);
    return `${years}yr`;
  }
}
