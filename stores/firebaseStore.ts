import { create } from 'zustand';

interface FirebaseState {
  confirmationResult: any | null;
  setConfirmationResult: (result: any) => void;
  clearConfirmationResult: () => void;
}

/**
 * Transient store to pass the Firebase confirmation object
 * from the Phone Input Screen -> OTP Screen without serializing it.
 */
export const useFirebaseStore = create<FirebaseState>((set) => ({
  confirmationResult: null,
  setConfirmationResult: (result) => set({ confirmationResult: result }),
  clearConfirmationResult: () => set({ confirmationResult: null }),
}));
