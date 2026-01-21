import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse, Pagination } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import {
  Notification,
  UpdateNotificationStatusDto,
} from "@web/libs/notification";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    getNotifications: builder.query<
      CustomResponse<Pagination<Notification[]>>,
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params,
      }),
    }),
    getNotification: builder.query<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "GET",
      }),
    }),
    markAllAsRead: builder.mutation<void, UpdateNotificationStatusDto>({
      query: (data) => ({
        url: "/notifications/mark-all",
        method: "PATCH",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useMarkAllAsReadMutation,
} = notificationApi;
