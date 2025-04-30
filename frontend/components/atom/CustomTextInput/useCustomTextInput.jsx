"use client";

export default function useCustomTextInput(setContent) {
  const handleOnChange = (e) => {
    const inputContent = e.target.value;

    setContent(inputContent);
  };
  return {
    handleOnChange,
  };
}
