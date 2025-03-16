'use client'
import { apiPost } from '@/utils/fetch/fetch';
import uploadImage from '@/utils/uploadImage';
import { useState, useRef } from 'react';

export const useCommentContent = ( ) => {
    const [commentContent, setCommentContent] = useState('');
    const handleSubmit = async (selectedImage, onClick) => {
        if (commentContent.trim() === '' && !selectedImage) {
            return;
        }
        // Check if the comment content exceeds the character limit
        if (commentContent.length > 500) {
            alert('Comment content exceeds the character limit of 500 characters.');
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
                alert('Please login to comment');
                return;
            }

            const imageUrl = selectedImage ? await uploadImage(selectedImage) : null;
            await apiPost('/api/forum/comments/create/', {
                content: commentContent,
                image_urls: [imageUrl],
                user_id: user.id,
            },  {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            // Reset the textarea content
            onClick();
            setCommentContent('');
        }

        // Reset states
        
    };

    

    return {
        handleSubmit,
        commentContent,
        setCommentContent,
    };
};