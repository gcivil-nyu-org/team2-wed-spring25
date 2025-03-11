import Button from "@/components/atom/Button/Button";
import Icon from "@/components/atom/Icon/Icon";
import UserImage from "@/components/atom/UserImage/UserImage";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useFileUpload } from "@/hooks/useFileUpload";
import EmojiPicker from "emoji-picker-react";
import { usePostContent } from "./usePostContent";
export default function PostDialog({
    onClick,
}) {

    const {
        emojiPickerRef,
        showEmojiPicker,
        handleClickOnEmojiPicker,
        handleOnEmojiClick,
    } = useEmojiPicker();

    const {
        fileInputRef,
        selectedImage,
        selectedImageName,
        handleOpenImageSelector,
        handleRemoveImage,
        handleFileChange,
    } = useFileUpload();

    const {
        postContent,
        setPostContent,
        handleSubmit
    } = usePostContent();
    

    // const contentEditableRef = useRef(null);

    // Handle keydown events

    // Handle input changes
    // const handleInput = (e) => {
    //     const text = e.target.textContent;
    //     if (postContent === "Share Your Thoughts...") {
    //         setPostContent(text);
    //         return;
    //     }else{
    //         setPostContent(text);
    //     }
    // };

    // useEffect(() => {
    //     if (contentEditableRef.current) {
    //         contentEditableRef.current.textContent = postContent;
    //     }
    // }
    // , [postContent]);
    // useEffect(() => {
    //     if (contentEditableRef.current) {
    //         contentEditableRef.current.focus();
    //     }
    // }, []);
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
                    <div className="flex flex-col flex-1 justify-between overflow-y-auto h-full">
                        <textarea sd
                            type="text" 
                            className="pl-7 text-xl flex-1 resize-none outline-none placeholder-slate-600 " 
                            placeholder="Share Your Thoughts..."      
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                        />
                        {
                            selectedImage && 
                            <div className="mx-5 px-3 p-2 flex justify-between items-center border-2 border-slate-300 rounded">
                                <p className="text-lg">
                                    {selectedImageName}
                                </p>
                                <Icon onClick={handleRemoveImage} src={"/icons/close.svg"}
                                    width={15}
                                    height={15}
                                    alt="Close"
                                    size={"md"}
                                />
                            </div>
                            
                        }
                        {/* <div 
                            className="w-full h-1 outline-none pl-7 text-xl relative text-slate-700 select-text" 
                            contentEditable="true"
                            ref={contentEditableRef}
                            onInput={handleInput}
                            suppressContentEditableWarning={true} 
                            >
                            {postContent === "" && "Share Your Thoughts..."}
                            {postContent !== "" && postContent}
                            <div>
                            {selectedImage &&
                                <Image
                                    src={selectedImage}
                                    width={500}
                                    height={500}
                                    alt={selectedImageName}
                                    className="absolute w-full left-0 mt-4 select-none"
                                />
                                }
                            </div>
                        </div> */}
                    </div>
                    
                    <div className="flex justify-between items-center mx-3 px-2 pt-3">
                        {
                            showEmojiPicker && <div className="absolute bottom-14" ref={emojiPickerRef}>
                                <EmojiPicker height={400} onEmojiClick={(emojiObject) => handleOnEmojiClick(emojiObject, setPostContent)}/>
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
                        <Button onClick={() => {
                            handleSubmit(selectedImage, onClick);

                        }}>
                            Post
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}