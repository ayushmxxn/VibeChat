import { create } from 'zustand'
import { db } from './Firebase'
import { doc, getDoc } from 'firebase/firestore'

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false })

    try {
      // Assume the collection name is 'users'
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false })
      } else {
        set({ currentUser: null, isLoading: false })
      }
    } catch (error) {
      console.log(error)
      return set({ currentUser: null, isLoading: false })
    }
  }
}))