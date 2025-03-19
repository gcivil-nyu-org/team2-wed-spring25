"use client";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";
import { getUserFullName } from "@/utils/string";
import uploadImage from "@/utils/uploadImage";
import { useState } from "react";

export const usePostContent = (setPosts, posts_count) => {
  const [postContent, setPostContent] = useState("");

  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable button during API call
  const [isLoading, setIsLoading] = useState(false); // Loading state for visual feedback
  const { showError } = useNotification();
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

      const userString = localStorage.getItem("user"); // Retrieve the user from localStorage
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

      console.log("user", user);

      // Upload the image if selected
      const imageUrl = selectedImage ? await uploadImage(selectedImage) : null;
      const newPost = {
        comments_count: 0,
        content: postContent,
        date_created: new Date().toISOString(),
        id: posts_count + 1,
        image_urls: imageUrl ? [imageUrl] : [],
        is_following_author: false,
        like_type: null,
        likes_count: 0,
        title: "",
        user_avatar: user.avatar,
        user_fullname: getUserFullName(user.first_name, user.last_name),
        user_has_liked: false,
        user_id: user.id,
        user_karma: user.karma,
      };

      setPosts((prev) => [newPost, ...prev]);

      // Make the API call
      const response = await apiPost(
        "/api/forum/posts/create/",
        {
          content: postContent,
          image_urls: imageUrl ? [imageUrl] : [],
          user_id: user.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201) {
        throw new Error(response.message || "Failed to create post.");
      }

      console.log("response", response);

      // Reset the form
      setPostContent("");
      onClick(); // Close the form or reset the state
    } catch (error) {
      console.error("Error submitting post:", error);
      showError("Failed to submit post. Please try again.");
    } finally {
      setIsButtonDisabled(false); // Re-enable the button
      setIsLoading(false); // Hide loading spinner
    }
  };
  return {
    handleSubmit,
    postContent,
    setPostContent,
    isButtonDisabled,
    isLoading,
  };
};
