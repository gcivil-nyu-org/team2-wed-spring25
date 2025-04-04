// Debug logger helper
const debugLog = (message, data) => {
    if (process.env.NEXT_PUBLIC_DEBUG_USER_PROVIDER === 'true' ) {
      console.log(`[UserProvider] ${message}`, data);
    }
  };
export default debugLog;  