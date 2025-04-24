"use client";
import { Filter } from "bad-words";

export default function useCustomTextInput(setContent) {
  const filter = new Filter();
  const handleOnChange = (e) => {
    const inputContent = e.target.value;

    setContent(filter.clean(inputContent));
  };
  return {
    handleOnChange,
  };
}
