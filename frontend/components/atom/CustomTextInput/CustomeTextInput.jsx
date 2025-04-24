"use client";
import useCustomTextInput from "./useCustomTextInput";

export default function CustomTextInput({
  content,
  setContent,
  placeholder,
  isLoading = false,
}) {
  const { handleOnChange } = useCustomTextInput(setContent);
  return (
    <textarea
      className={`outline-none w-full bg-transparent flex text-forum-subheading justify-start items-center pl-3 resize-none relative top-2 ${
        content === "" ? "text-gray-400" : "pr-3"
      }`}
      onChange={handleOnChange}
      placeholder={placeholder}
      value={content}
      disabled={isLoading}
    />
  );
}
