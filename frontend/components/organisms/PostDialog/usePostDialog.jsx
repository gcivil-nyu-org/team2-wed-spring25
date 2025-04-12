"use client";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { useForumStore } from "@/stores/useForumStore";
import { apiPost } from "@/utils/fetch/fetch";
import { getUserFullName } from "@/utils/string";
import uploadImage from "@/utils/uploadImage";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

export const usePostDialog = (
  onClick,
  is_edit,
  post_id,
  content,
  setIsPostDialogOpen,
  is_repost,
  original_post_id
) => {
  const [postContent, setPostContent] = useState(is_edit ? content : ""); // State for post content

  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable button during API call
  const [isLoading, setIsLoading] = useState(false); // Loading state for visual feedback
  const { showError } = useNotification();
  const postDialogRef = useRef(null); // Ref for the post dialog container
  const { userPosts, setUserPosts } = useForumStore(
    useShallow((state) => ({
      userPosts: state.userPosts,
      setUserPosts: state.setUserPosts,
    }))
  );
  const handleSubmit = async (selectedImage, onClick) => {
    // Input validation
    if (postContent.trim() === "" && !selectedImage) {
      showError("Post content or image is required.");
      return;
    }

    // Check if the post content exceeds the character limit
    if (postContent.length > 800) {
      showError("Post content must be less than 800 characters.");
      return;
    }

    try {
      setIsButtonDisabled(true); // Disable the button
      setIsLoading(true); // Show loading spinner
      let userString = null;
      if (typeof window !== "undefined") {
        userString = localStorage.getItem("user"); // Retrieve the user from localStorage
      }

      let user = null;
      if (userString) {
        user = JSON.parse(userString); // Parse the user object
      } else {
        console.log("No user data found in localStorage");
      }

      if (!user) {
        showError("Please login to post.");
        return;
      }

      // Upload the image if selectedImage exists and selectedImage doesnt start with "https"
      let imageUrl = null;
      if (selectedImage && selectedImage.startsWith("https")) {
        imageUrl = selectedImage;
      } else if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }
      // Make the API call
      const response = await apiPost(
        "/forum/posts/create/",
        {
          content: postContent,
          image_urls: imageUrl ? [imageUrl] : [],
          user_id: user.id,
          is_edit: is_edit ?? false,
          post_id: (is_repost ? original_post_id : post_id) ?? 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const newPost = {
        comments_count: 0,
        content: postContent,
        date_created: new Date().toISOString(),
        id: response.id,
        image_urls: imageUrl ? [imageUrl] : [],
        is_following_author: false,
        like_type: null,
        likes_count: 0,
        title: "",
        user_avatar: user?.avatar || null,
        user_fullname: getUserFullName(
          user?.first_name || "Unknown",
          user?.last_name || "Unknown"
        ),
        user_has_liked: false,
        user_id: user.id,
        user_karma: response.user.karma,
      };

      if (!is_edit) {
        setUserPosts([newPost, ...userPosts]);
      } else {
        const updatedUserPosts = userPosts.map((post) =>
          post.id === post_id
            ? {
                ...post,
                content: postContent,
                image_urls: imageUrl ? [imageUrl] : [],
              }
            : post
        );
        setUserPosts(updatedUserPosts);
      }

      // Reset the form
      setPostContent("");
      onClick(); // Close the form or reset the state
    } catch (error) {
      console.error("Error submitting post:", error);
      showError("Failed to submit post. Please try again.");
    } finally {
      setIsButtonDisabled(false); // Re-enable the button
      setIsLoading(false); // Hide loading spinner
      if (setIsPostDialogOpen) {
        setIsPostDialogOpen(false); // Close the dialog if setIsPostDialogOpen is provided
      }
    }
  };

  // Function to close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        postDialogRef.current &&
        !postDialogRef.current.contains(event.target)
      ) {
        onClick(); // Close the dialog
      }
    };

    // Add event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    handleSubmit,
    postContent,
    setPostContent,
    isButtonDisabled,
    isLoading,
    postDialogRef,
  };
};
