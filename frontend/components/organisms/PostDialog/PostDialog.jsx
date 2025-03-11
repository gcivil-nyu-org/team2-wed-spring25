import Button from "@/components/atom/Button/Button";
import Icon from "@/components/atom/Icon/Icon";
import UserImage from "@/components/atom/UserImage/UserImage";
import EmojiPicker from "emoji-picker-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

export default function PostDialog({
    onClick,
}) {
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const textAreaRef = useRef(null);

    const [selectedImage, setSelectedImage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const handleClickOnEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
    }

    const handleOpenImageSelector = (e) => {
        fileInputRef.current.click();
    }

    const handleRemoveImage = (e) => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log(file);
        
        if (file){
            setSelectedImage(file);
        }
    }

    const handleOnEmojiClick = (emojiObject) => {
        textAreaRef.current.value += emojiObject.emoji;
        setShowEmojiPicker(false);
    }

    useEffect(() => {
        const handleClickOutsideEmojiPicker = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutsideEmojiPicker);

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideEmojiPicker);
        }
    });

    return (
        <div className="flex justify-center items-start pt-10 fixed w-full h-full bg-black bg-opacity-50 left-0 top-0">
            <div className="w-1/2 h-4/5 bg-white rounded-lg flex flex-col">
                <div className="flex justify-between mb-2 p-4">
                    <div className="flex items-center p-3 rounded-2xl hover:bg-gray-200">
                        <UserImage
                            imageUrl={"/images/user6.jpg"}
                            width={50}
                            height={50}
                        />
                        <div className="ml-4">
                            <h1 className="text-xl font-bold leading-none">Shreyash Dhamane</h1>
                            <p className="font-extralight text-sm">Post to Anyone</p>
                        </div>
                    </div>
                    <Icon 
                        onClick={onClick} 
                        src={"/icons/close.svg"}
                        width={20}
                        height={20}
                        alt="Close"
                        size={"lg"}
                        />
                </div>
                <div className="mb-4 flex-1 flex flex-col justify-between relative">
                    <div className="flex flex-col flex-1 justify-between ">
                        <textarea sd
                            type="text" 
                            className="pl-7 text-xl flex-1 resize-none outline-none placeholder-slate-600 " 
                            placeholder="Share Your Thoughts..."      
                            ref={textAreaRef}   
                        />
                        {
                            //TODO: do it similar to linkedin
                            selectedImage && 
                            <div className="mx-5 px-3 p-2 flex justify-between items-center border-2 border-slate-300 rounded">
                                <p className="text-lg">
                                    {selectedImage.name}
                                </p>
                                <Icon onClick={handleRemoveImage} src={"/icons/close.svg"}
                                    width={15}
                                    height={15}
                                    alt="Close"
                                    size={"md"}
                                />
                            </div>
                        }
                    </div>
                    
                    <div className="flex justify-between items-center mx-3 px-2 pt-3">
                        {
                            showEmojiPicker && <div className="absolute bottom-14" ref={emojiPickerRef}>
                                <EmojiPicker height={400} onEmojiClick={handleOnEmojiClick}/>
                            </div>
                        }
                        <div className="flex">
                            <Icon
                                onClick={handleClickOnEmojiPicker}
                                src={"/icons/emoji.svg"}
                                width={20}
                                height={20}
                                alt="Emoji Picker"
                                size={"lg"}
                            />
                            <Icon
                                onClick={handleOpenImageSelector}
                                src={"/icons/image-picker.svg"}
                                width={20}
                                height={20}
                                alt="Image Picker"
                                size={"lg"}
                            />
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>
                        <Button>
                            Post
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}