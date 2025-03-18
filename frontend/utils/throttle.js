const throttle = (func, delay) => {
  let lastExecuted = 0; // Tracks the last execution time

  return (...args) => {
    const now = Date.now(); // Current timestamp

    // If the time since the last execution is greater than the delay, execute immediately
    if (now - lastExecuted >= delay) {
      func(...args); // Execute the function
      lastExecuted = now; // Update the last execution time
    }
  };
};

export default throttle;
