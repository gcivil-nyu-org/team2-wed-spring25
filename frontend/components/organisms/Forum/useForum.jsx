"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { apiGet } from "@/utils/fetch/fetch";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import userHeadings from "@/constants/headers";

export default function useForum(settingsType) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // For loading more posts
  const [isUserDataCardLoading, setIsUserDataCardLoading] = useState(true);
  const [userSideCardData, setUserSideCardData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [offset, setOffset] = useState(0); // Track the current offset
  const [hasMore, setHasMore] = useState(true); // Track if there are more posts to fetch
  const loaderRef = useRef(null);
  const limit = 10; // Number of posts to fetch per request
  const [userHeading, setUserHeading] = useState(0);
  useEffect(() => {
    let userHeading =
      userHeadings[Math.floor(Math.random() * userHeadings.length)];
    setUserHeading(userHeading);
  }, []);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const { showError, showSuccess } = useNotification();

  let userData = null;
  if (typeof window !== "undefined") {
    userData = localStorage.getItem("user");
  }
  const user = JSON.parse(userData);

  // Fetch initial posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await apiGet(
          `/forum/posts?user_id=${user?.id}&offset=0&limit=${limit}&settings_type=${settingsType}`
        );
        if (response) {
          setUserPosts(response.posts);
          setHasMore(response.has_more); // Update hasMore based on the response
        }
      } catch (error) {
        showSuccess("Trending posts.");
        console.error("Error fetching posts, it works though:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [user?.id, showSuccess, settingsType, limit]);

  // Fetch more posts
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || isLoadingMore) return; // Stop if no more posts or already loading

    try {
      setIsLoadingMore(true);
      const newOffset = offset + limit;
      const response = await apiGet(
        `/forum/posts?user_id=${user?.id}&offset=${newOffset}&limit=${limit}&settings_type=${settingsType}` // Pass settingsType to the API
      );
      if (response) {
        setUserPosts((prevPosts) => [...prevPosts, ...response.posts]); // Append new posts
        setHasMore(response.has_more); // Update hasMore based on the response
        setOffset(newOffset); // Update the offset
      }
    } catch (error) {
      // showError("Error fetching more posts");
      console.error("Error fetching more posts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore]);

  useEffect(() => {
    const currentLoaderRef = loaderRef.current;

    if (!currentLoaderRef || !hasMore) return;

    const handleIntersection = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoadingMore) {
        loadMorePosts();
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "20px",
      threshold: 0.3,
    });

    observer.observe(currentLoaderRef);

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [loadMorePosts, hasMore, isLoadingMore]); // Dependencies that affect when we should observe

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await apiGet(`/forum/user_data?user_id=${user?.id}`);

        setUserSideCardData(data);
      } catch (error) {
        showError("Error fetching user data");
        console.error("Error fetching user data:", error);
      } finally {
        // Any additional logic after fetching user data
        setIsUserDataCardLoading(false); // Set loading to false after fetching user data
      }
    };
    getUserData();
  }, [user?.id, showError]); // Added missing dependencies

  return {
    isLoading,
    isLoadingMore,
    isOpen,
    userPosts,
    handleClick,
    user,
    setUserPosts,
    loadMorePosts,
    hasMore,
    loaderRef,
    userHeading,
    isUserDataCardLoading,
    userSideCardData,
  };
}
