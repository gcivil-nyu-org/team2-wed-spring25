import Icon from "@/components/atom/Icon/Icon";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import EmojiPicker from "emoji-picker-react";
import { useCommentContent } from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/useCommentContent";
import CommentButton from "@/components/atom/CommentButton/CommentButton";
import CustomTextInput from "@/components/atom/CustomTextInput/CustomeTextInput";

export default function UserPostCommentSection() {
    const {
            emojiPickerRef,
            showEmojiPicker,
            handleClickOnEmojiPicker,
            handleOnEmojiClick,
        } = useEmojiPicker();
    const {
            commentContent,
            setCommentContent,
        } = useCommentContent();
    

    return (
        <div className="flex flex-col">
            <div className="flex flex-col">
                <div className={`flex justify-between text-sm ${commentContent !== '' ? " flex-col rounded-3xl " : "rounded-full"} border-[1px] mx-1 border-slate-300 relative`}>
                    {
                        showEmojiPicker &&  <div className="absolute bottom-16 right-0" ref={emojiPickerRef}>
                                                <EmojiPicker height={400} onEmojiClick={(emojiObject) => handleOnEmojiClick(emojiObject, setCommentContent)}/>
                                            </div>
                    }
                    
                    <CustomTextInput 
                        content={commentContent}
                        setContent={setCommentContent}
                        placeholder={"Add a comment..."}
                    />
                    
                    <div className="flex justify-between">
                        <Icon
                            onClick={handleClickOnEmojiPicker}
                            src={"/icons/emoji.svg"}
                            width={20}
                            height={20}
                            alt="Image Picker"
                            size={"lg"}
                        />
                        {
                            commentContent !== "" 
                            && 
                            <div>
                                <CommentButton >
                                    Comment
                                </CommentButton>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}