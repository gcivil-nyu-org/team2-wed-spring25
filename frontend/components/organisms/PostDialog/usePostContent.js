'use client'
import { apiPost } from '@/utils/fetch/fetch';
import uploadImage from '@/utils/uploadImage';
import { useState, useRef } from 'react';

export const usePostContent = ( ) => {
    const [postContent, setPostContent] = useState('');
    
    const handleSubmit = async (selectedImage, onClick) => {
        if (postContent.trim() === '' && !selectedImage) {
            return;
        }
        // Check if the post content exceeds the character limit
        if (postContent.length > 500) {
            alert('Post content exceeds the character limit of 500 characters.');
            return;
        }
        try {
            const userString = localStorage.getItem('user'); // Retrieve the string
            let user = null;
            if (userString) {
                user = JSON.parse(userString); // Parse the string into a JSON object
                console.log(user); // Use the JSON object
            } else {
                console.log('No user data found in localStorage');
            }
            
            if (!user) {
                alert('Please login to post');
                return;
            }

            const imageUrl = selectedImage ? await uploadImage(selectedImage) : null;
            await apiPost('forum/posts/create/', {
                content: postContent,
                image_urls: [imageUrl],
                user_id: user.id,
            },  {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Error submitting post:', error);
        } finally {
            // Reset the textarea content
            onClick();
            setPostContent('');
        }

        // Reset states
        
    };
    return {
        handleSubmit,
        postContent,
        setPostContent,
    };
};