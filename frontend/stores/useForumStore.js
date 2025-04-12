import { apiGet } from "@/utils/fetch/fetch";
import { create } from "zustand";

export const useForumStore = create((set) => ({
  userPosts: [],
  userCreatedPosts: [],
  userSideCardData: null,
  offset: 0,
  limit: 10,
  isUserDataCardLoading: true,
  isLoading: true,
  isLoadingMore: false,
  hasMore: true,
  isOpen: false,
  userHeading: 0,
  error: null,
  setttingsType: "",
  setInitialUserPosts: async (userId, settingsType) => {
    try {
      set({ isLoading: true });
      const response = await apiGet(
        `/forum/posts?user_id=${userId}&offset=0&limit=${
          useForumStore.getState().limit
        }&settings_type=${settingsType}`
      );
      if (response) {
        set({ userPosts: response.posts || [] });
        set({ hasMore: response.has_more }); // Update hasMore based on the response
        console.log("Fetched initial user posts:", response.posts);
      }

      const data = await apiGet(`/forum/user_data?user_id=${userId}`);
      console.log("Fetched user side card data:", data);

      set({ userSideCardData: data || null });
    } catch (error) {
      console.error(
        "Error fetching posts/side card data, it works though:",
        error
      );
      set({ error: error.message || "Failed to fetch posts" });
    } finally {
      set({ isLoading: false, isUserDataCardLoading: false });
    }
  },
  setUserPosts: (posts) => set({ userPosts: posts }),
  setUserCreatedPosts: (posts) => set({ userCreatedPosts: posts }),
  setUserSideCardData: (data) => set({ userSideCardData: data }),
  setOffset: (offset) => set({ offset: offset }),
  setLimit: (limit) => set({ limit: limit }),
  setIsUserDataCardLoading: (isLoading) =>
    set({ isUserDataCardLoading: isLoading }),
  setIsLoading: (isLoading) => set({ isLoading: isLoading }),
  setIsLoadingMore: (isLoadingMore) => set({ isLoadingMore: isLoadingMore }),
  setHasMore: (hasMore) => set({ hasMore: hasMore }),
  setIsOpen: (isOpen) => set({ isOpen: isOpen }),
  setSettingsType: (settingsType) => set({ setttingsType: settingsType }),
  setUserHeading: (userHeading) => set({ userHeading: userHeading }),
  setError: (error) => set({ error: error }),
}));
