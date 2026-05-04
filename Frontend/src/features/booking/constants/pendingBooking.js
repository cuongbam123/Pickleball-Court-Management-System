export const PENDING_BOOKING_STORAGE_KEY = "pending_booking_after_login";

export const readPendingBookingDraft = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Cannot parse pending booking draft:", error);
    return null;
  }
};

export const writePendingBookingDraft = (draft) => {
  try {
    sessionStorage.setItem(PENDING_BOOKING_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn("Cannot save pending booking draft:", error);
  }
};

export const clearPendingBookingDraft = () => {
  sessionStorage.removeItem(PENDING_BOOKING_STORAGE_KEY);
};
