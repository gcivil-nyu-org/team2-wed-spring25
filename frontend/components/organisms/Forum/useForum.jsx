"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { apiGet } from "@/utils/fetch/fetch";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import userHeadings from "@/constants/headers";
import { useForumStore } from "@/stores/useForumStore";
import { useShallow } from "zustand/shallow";

export default function useForum(settingsType) {
  const {
    isLoading,
    userPosts,
    setUserPosts,
    isOpen,
    setIsOpen,
    userHeading,
    setUserHeading,
    hasMore,
    setHasMore,
    offset,
    setOffset,
    limit,
    isLoadingMore,
    setIsLoadingMore,
    setIsLoading,
  } = useForumStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      userPosts: state.userPosts,
      setUserPosts: state.setUserPosts,
      isOpen: state.isOpen,
      setIsOpen: state.setIsOpen,
      userHeading: state.userHeading,
      setUserHeading: state.setUserHeading,
      hasMore: state.hasMore,
      setHasMore: state.setHasMore,
      offset: state.offset,
      setOffset: state.setOffset,
      limit: state.limit,
      isLoadingMore: state.isLoadingMore,
      setIsLoadingMore: state.setIsLoadingMore,
      setIsLoading: state.setIsLoading,
    }))
  );

  const loaderRef = useRef(null);

  useEffect(() => {
    let userHeading =
      userHeadings[Math.floor(Math.random() * userHeadings.length)];
    setUserHeading(userHeading);
  }, []);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  let userData = null;
  if (typeof window !== "undefined") {
    userData = localStorage.getItem("user");
  }
  const user = JSON.parse(userData);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      try {
        setIsLoading(true);
        const response = await apiGet(
          `/forum/posts?user_id=${user?.id}&offset=0&limit=${limit}&settings_type=${settingsType}` // Pass settingsType to the API
        );
        if (response) {
          setUserPosts(response.posts || []);
          setHasMore(response.has_more); // Update hasMore based on the response
          console.log("Fetched initial user posts:", response.posts);
        }
      } catch (error) {
        console.error("Error fetching initial posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchInitialPosts();
    }
  }, [user?.id, settingsType]); // Ensure user ID and settingsType are available

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
        setUserPosts([...userPosts, ...response.posts]); // Append new posts
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
  };
}
