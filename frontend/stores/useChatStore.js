import { apiGet } from "@/utils/fetch/fetch";
import { create } from "zustand";

export const useChatStore = create((set) => ({
  chatUserList: [],
  onlineUsers: [],
  listOfUsersTyping: [],
  selectedUser: null,
  isLoading: true,
  error: null,

  setInitialChatUserList: async (userId) => {
    // Early return if no userId or already loaded
    console.log(
      "setInitialChatUserList called and data before it is: ",
      useChatStore.getState().chatUserList.length
    );

    if (!userId || useChatStore.getState().chatUserList.length > 0) {
      set({ isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const response = await apiGet(`/chats/${userId}`);
      console.log("Fetched initial chat users:", response.data);

      set({ chatUserList: response.data });
    } catch (error) {
      console.error("Failed to fetch chat users:", error);
      set({ error: error.message || "Failed to fetch chat users" });
    } finally {
      set({ isLoading: false });
    }
  },

  setChatUserList: (chatUserList) => set({ chatUserList: chatUserList }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers: onlineUsers }),
  setListOfUsersTyping: (listOfUsersTyping) =>
    set({ listOfUsersTyping: listOfUsersTyping }),
  setSelectedUser: (selectedUser) => set({ selectedUser: selectedUser }),
  setIsLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
}));
