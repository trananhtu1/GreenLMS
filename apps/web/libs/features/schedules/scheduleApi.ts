import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import {
  CreateTeachingSchedulesDto,
  ISchedule,
  UpdateSchedulePayload,
} from "@web/libs/schedule";

export const scheduleApi = createApi({
  reducerPath: "scheduleApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    getSchedules: builder.query<
      CustomResponse<ISchedule[]>,
      {
        startDate: string;
        endDate: string;
        teacherId?: string;
      }
    >({
      query: (params) => ({
        url: "/schedules",
        method: "GET",
        params,
      }),
    }),
    createTeachingSchedules: builder.mutation<
      CustomResponse<ISchedule[]>,
      CreateTeachingSchedulesDto
    >({
      query: (data) => {
        return {
          url: "/schedules/teaching",
          method: "POST",
          body: data,
        };
      },
    }),

    updateSchedule: builder.mutation<
      CustomResponse<ISchedule>,
      {
        id: string;
        data: UpdateSchedulePayload;
      }
    >({
      query: ({ id, data }) => ({
        url: `/schedules/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteSchedule: builder.mutation<CustomResponse<any>, string>({
      query: (id) => ({
        url: `/schedules/${id}`,
        method: "DELETE",
      }),
    }),
    getStudentSchedules: builder.query<
      CustomResponse<ISchedule[]>,
      {
        startDate: string;
        endDate: string;
      }
    >({
      query: (params) => ({
        url: "/schedules/student",
        method: "GET",
        params,
      }),
    }),
  }),
});

export const {
  useGetSchedulesQuery,
  useCreateTeachingSchedulesMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  useGetStudentSchedulesQuery,
} = scheduleApi;
