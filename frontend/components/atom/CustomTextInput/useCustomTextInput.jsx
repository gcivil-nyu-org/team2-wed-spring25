"use client";
import { useRef } from "react";

export default function useCustomTextInput(content, setContent, placeholder) {
  const editableDivRef = useRef(null);
  // Handle input in the editable div
  const handleEditableDivInput = (e) => {
    const element = editableDivRef.current;
    const text = element.textContent;

    // Get the current cursor position
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const cursorPosition = range.startOffset;

    // Remove placeholder text if it exists
    if (text !== placeholder) {
      setContent(text);
    }

    // Restore the cursor position after updating the content
    setTimeout(() => {
      const newRange = document.createRange();
      newRange.setStart(element.childNodes[0], cursorPosition);
      newRange.collapse(true);

      const newSelection = window.getSelection();
      newSelection.removeAllRanges();
      newSelection.addRange(newRange);
    }, 0);
  };

  const handleEditableDivFocus = (e) => {
    if (content === "") {
      moveCursorToStart(editableDivRef.current); // Move cursor to the start when focused
    }
  };

  // Add this function to handle the blur event
  const handleEditableDivBlur = (e) => {
    if (content === "") {
      editableDivRef.current.textContent = placeholder;
    }
  };

  const handleEditableDivPaste = (e) => {
    e.preventDefault(); // Prevent default paste behavior

    // Get pasted text from clipboard
    const pastedText = e.clipboardData.getData("text/plain");

    // Append pasted text to the end of the current content
    const newText = content + pastedText;
    setContent(newText);

    // Update the DOM with the new content
    if (editableDivRef.current) {
      editableDivRef.current.textContent = newText;
    }

    // Move cursor to the end
    moveCursorToEnd(editableDivRef.current);
  };

  const handleEditableDivOnClick = (e) => {
    if (content === "") {
      moveCursorToStart(e.target); // Move cursor to the start when clicked
    }
  };

  const handleEditableDivKeyDown = (e) => {
    if (content === "") {
      // Remove placeholder text before adding the new character
      setContent("");
      editableDivRef.current.textContent = "";
    }
  };

  const moveCursorToEnd = (element) => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false); // Collapse range to the end
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const moveCursorToStart = (element) => {
    const range = document.createRange();
    const selection = window.getSelection();

    // Select the contents of the element
    range.selectNodeContents(element);

    // Collapse the range to the start (beginning) of the element
    range.collapse(true);

    // Remove any existing selections and add the new range
    selection.removeAllRanges();
    selection.addRange(range);
  };

  return {
    editableDivRef,
    handleEditableDivInput,
    handleEditableDivFocus,
    handleEditableDivBlur,
    handleEditableDivPaste,
    handleEditableDivOnClick,
    handleEditableDivKeyDown,
  };
}
