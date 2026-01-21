import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Notification } from "@web/libs/notification";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    appendNotifications: (state, action: PayloadAction<Notification[]>) => {
      // Filter out duplicates based on ID
      const newNotifications = action.payload.filter(
        (newNotification) =>
          !state.notifications.some(
            (existingNotification) =>
              existingNotification.id === newNotification.id,
          ),
      );

      state.notifications = [...state.notifications, ...newNotifications];
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAllAsRead,
  appendNotifications,
} = notificationSlice.actions;
export default notificationSlice;
