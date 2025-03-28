import useCustomTextInput from "./useCustomTextInput";

export default function CustomTextInput({
  content,
  setContent,
  placeholder,
  isLoading = false,
}) {
  const {
    editableDivRef,
    handleEditableDivInput,
    handleEditableDivOnClick,
    handleEditableDivFocus,
    handleEditableDivPaste,
    handleEditableDivKeyDown,
    handleEditableDivBlur,
  } = useCustomTextInput(content, setContent, placeholder);
  return (
    <div
      contentEditable={isLoading ? false : true}
      suppressContentEditableWarning={true}
      ref={editableDivRef}
      className={`outline-none flex items-center pl-3  ${
        content === "" ? "text-gray-500" : "pt-2"
      }`}
      onInput={handleEditableDivInput}
      onClick={handleEditableDivOnClick}
      onFocus={handleEditableDivFocus}
      onPaste={handleEditableDivPaste}
      onKeyDown={handleEditableDivKeyDown}
      onBlur={handleEditableDivBlur}
    >
      {content === "" ? placeholder : content}
    </div>
  );
}
