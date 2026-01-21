import { configureStore } from "@reduxjs/toolkit";
import { apiErrorMiddleware } from "./apiErrorMiddleware";
import { authApi } from "./features/auth/authApi";
import { authSlice } from "./features/auth/authSlice";
import { classApi } from "./features/classes/classApi";
import { courseApi } from "./features/courses/courseApi";
import { departmentApi } from "./features/departments/departmentApi";
import { fieldApi } from "./features/fields/fieldApi";
import layoutSlice from "./features/layout/layoutSlice";
import { notificationApi } from "./features/notifications/notificationApi";
import notificationSlice from "./features/notifications/notificationSlice";
import { requestApi } from "./features/requests/requestApi";
import { roomApi } from "./features/rooms/roomApi";
import { scheduleApi } from "./features/schedules/scheduleApi";
import tableSlice from "./features/table/tableSlice";
import { userApi } from "./features/users/userApi";
import { weeklyNormApi } from "./features/weekly-norms/weeklyNormApi";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [authApi.reducerPath]: authApi.reducer,
      layout: layoutSlice.reducer,
      table: tableSlice.reducer,
      [userApi.reducerPath]: userApi.reducer,
      [requestApi.reducerPath]: requestApi.reducer,
      [weeklyNormApi.reducerPath]: weeklyNormApi.reducer,
      [scheduleApi.reducerPath]: scheduleApi.reducer,
      [roomApi.reducerPath]: roomApi.reducer,
      [courseApi.reducerPath]: courseApi.reducer,
      [classApi.reducerPath]: classApi.reducer,
      notification: notificationSlice.reducer,
      [notificationApi.reducerPath]: notificationApi.reducer,
      [fieldApi.reducerPath]: fieldApi.reducer,
      [departmentApi.reducerPath]: departmentApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(
          authApi.middleware,
          userApi.middleware,
          requestApi.middleware,
          weeklyNormApi.middleware,
          scheduleApi.middleware,
          roomApi.middleware,
          courseApi.middleware,
          classApi.middleware,
          notificationApi.middleware,
          fieldApi.middleware,
          departmentApi.middleware,
        )
        .concat(apiErrorMiddleware),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
