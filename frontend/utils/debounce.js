const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId); // Clear the previous timeout
    timeoutId = setTimeout(() => {
      func(...args); // Call the function after the delay
    }, delay);
  };
};

export default debounce;
