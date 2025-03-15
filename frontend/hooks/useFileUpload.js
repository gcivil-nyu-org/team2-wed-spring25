import { truncateFilenameWithEllipsis } from '@/utils/string';
import { useState, useRef } from 'react';

export const useFileUpload = () => {
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageName, setSelectedImageName] = useState(null);

    const handleOpenImageSelector = () => {
        fileInputRef.current.click();
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setSelectedImageName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageName(truncateFilenameWithEllipsis(file.name, 20)); // Set the file name with ellipsis if too long
            const reader = new FileReader(); // Create a FileReader instance
            reader.readAsDataURL(file); // Read the file as a data URL
            reader.onloadend = () => {
                setSelectedImage(reader.result); // Set the base64-encoded image data
            };
        }
    };

    return {
        fileInputRef,
        selectedImage,
        selectedImageName,
        handleOpenImageSelector,
        handleRemoveImage,
        handleFileChange,
    };
};