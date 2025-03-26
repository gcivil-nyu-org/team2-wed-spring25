const throttle = (func, delay) => {
  let shouldWait = false;
  let waitingArgs = null;

  const timeoutFunc = () => {
    if (waitingArgs) {
      func(...waitingArgs);
      waitingArgs = null;
      setTimeout(timeoutFunc, delay);
    } else {
      shouldWait = false;
    }
  };

  return (...args) => {
    if (shouldWait) {
      waitingArgs = args;
      return;
    }

    func(...args);
    shouldWait = true;
    setTimeout(timeoutFunc, delay);
  };
};

export default throttle;
