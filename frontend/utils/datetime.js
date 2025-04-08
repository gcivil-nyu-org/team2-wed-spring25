import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

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

const formatDate = (dateString) => {
  const date = dayjs(dateString);

  const now = dayjs();

  const diffInDays = now.diff(date, "day");

  if (diffInDays > 6) {
    return date.format("MMM D, YYYY"); // e.g., "Jan 15, 2023"
  } else {
    // Otherwise use the relative time

    return date.fromNow();
  }
};

const getLastMessageTimeStampAMPM = (timestamp) => {
  const date = new Date(timestamp);

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Remove leading zero by converting to number and back
  const formattedHours = parseInt(hours % 12 || 12).toString();
  const formattedMinutes = minutes.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const getLastMessageTimeStamp = (timestamp) => {
  const now = new Date();
  const messageDate = new Date(timestamp);

  // Check if it's today
  if (
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear()
  ) {
    // Return time in 12-hour format (e.g., "2:30 PM")
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = parseInt(hours % 12 || 12).toString();
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  // Check if it's within the last 6 days
  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(now.getDate() - 6);

  if (messageDate > sixDaysAgo) {
    // Return day name (e.g., "Monday")
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[messageDate.getDay()];
  }

  // For older dates, return formatted date (e.g., "4/5/2025")
  const month = messageDate.getMonth() + 1;
  const day = messageDate.getDate();
  const year = messageDate.getFullYear();
  return `${month}/${day}/${year}`;
};

export { formatDate, getLastMessageTimeStampAMPM, getLastMessageTimeStamp };
