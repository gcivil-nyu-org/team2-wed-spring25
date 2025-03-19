"use client";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";
import uploadImage from "@/utils/uploadImage";
import { useState } from "react";

export const usePostContent = () => {
  const [postContent, setPostContent] = useState("");

  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable button during API call
  const [isLoading, setIsLoading] = useState(false); // Loading state for visual feedback
  const { showError } = useNotification();
  const handleSubmit = async (selectedImage, onClick) => {
    // Input validation
    if (postContent.trim() === "" && !selectedImage) {
      showError("Please enter some content or select an image.");
      return;
    }

    // Check if the post content exceeds the character limit
    if (postContent.length > 500) {
      showError("Post content exceeds the character limit of 500.");
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
        showError("User not found. Please log in again.");
        return;
      }

      // Upload the image if selected
      const imageUrl = selectedImage ? await uploadImage(selectedImage) : null;

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
