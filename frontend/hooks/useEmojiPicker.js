import { useState, useRef, useEffect } from 'react';

export const useEmojiPicker = () => {
    const emojiPickerRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleClickOnEmojiPicker = () => {
        setShowEmojiPicker((prev) => !prev);
    };

    const handleOnEmojiClick = (emojiObject, setPostContent) => {
        setPostContent((prevContent) => prevContent + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    useEffect(() => {
        const handleClickOutsideEmojiPicker = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideEmojiPicker);

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideEmojiPicker);
        };
    }, []);

    return {
        emojiPickerRef,
        showEmojiPicker,
        handleClickOnEmojiPicker,
        handleOnEmojiClick,
    };
};