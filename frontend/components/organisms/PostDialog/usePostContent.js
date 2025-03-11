import { apiPost } from '@/utils/fetch/fetch';
import uploadImage from '@/utils/uploadImage';
import { useState, useRef } from 'react';

export const usePostContent = ( ) => {
    const [postContent, setPostContent] = useState('');
    const textAreaRef = useRef(null);

    const handleSubmit = async (selectedImage) => {
        if (postContent.trim() === '' && !selectedImage) {
            return;
        }
        // Check if the post content exceeds the character limit
        if (postContent.length > 500) {
            alert('Post content exceeds the character limit of 500 characters.');
            return;
        }
        try {
            const accessToken = localStorage.getItem('djangoAccessToken');
            console.log('accessToken', accessToken);
            
            const imageUrl = selectedImage ? await uploadImage(selectedImage) : null;
            console.log('content', postContent);
            console.log('imageUrl', imageUrl);
            await apiPost('/api/forum/posts/create/', {
                content: postContent,
                image_urls: [imageUrl],
            },  {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            console.error('Error submitting post:', error);
        }

        // Reset states
        setPostContent('');
    };
    return {
        handleSubmit,
        postContent,
        setPostContent,
    };
};