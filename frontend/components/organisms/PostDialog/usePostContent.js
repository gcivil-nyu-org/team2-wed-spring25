"use client";
import { apiPost } from "@/utils/fetch/fetch";
import uploadImage from "@/utils/uploadImage";
import { useState, useRef } from "react";

export const usePostContent = () => {
  const [postContent, setPostContent] = useState("");

  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable button during API call
  const [isLoading, setIsLoading] = useState(false); // Loading state for visual feedback

  const handleSubmit = async (selectedImage, onClick) => {
    // Input validation
    if (postContent.trim() === "" && !selectedImage) {
      alert("Please enter post content or select an image.");
      return;
    }

    // Check if the post content exceeds the character limit
    if (postContent.length > 500) {
      alert("Post content exceeds the character limit of 500 characters.");
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
        alert("Please login to post.");
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
      alert("Failed to submit post. Please try again.");
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
