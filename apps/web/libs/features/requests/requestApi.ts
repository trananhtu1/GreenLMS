import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse, Pagination } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import {
  CreateRequestBusyScheduleDto,
  CreateRequestSupportTicketDto,
  CreateRequestTimeOffDto,
  CreateRequestWeeklyNormDto,
  IRequest,
  RequestAction,
} from "@web/libs/request";

export const requestApi = createApi({
  reducerPath: "requestApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    // Weekly Norm endpoints
    getWeeklyNorms: builder.query<
      CustomResponse<Pagination<IRequest[]>>,
      { search?: string; status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/requests/weekly-norms",
        method: "GET",
        params,
      }),
    }),

    getWeeklyNormById: builder.query<CustomResponse<IRequest>, string>({
      query: (id) => ({
        url: `/requests/weekly-norms/${id}`,
        method: "GET",
      }),
    }),

    createWeeklyNorm: builder.mutation<
      CustomResponse<IRequest>,
      CreateRequestWeeklyNormDto
    >({
      query: (body) => ({
        url: "/requests/weekly-norms",
        method: "POST",
        body,
      }),
    }),

    updateWeeklyNorm: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; data: Partial<CreateRequestWeeklyNormDto> }
    >({
      query: ({ id, data }) => ({
        url: `/requests/weekly-norms/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    updateWeeklyNormStatus: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; action: RequestAction }
    >({
      query: ({ id, action }) => ({
        url: `/requests/weekly-norms/${id}/status`,
        method: "PATCH",
        body: { action },
      }),
    }),

    deleteWeeklyNorm: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/requests/weekly-norms/${id}`,
        method: "DELETE",
      }),
    }),

    // Time Off endpoints
    getTimeOffs: builder.query<
      CustomResponse<Pagination<IRequest[]>>,
      { search?: string; status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/requests/time-offs",
        method: "GET",
        params,
      }),
    }),

    getTimeOffById: builder.query<CustomResponse<IRequest>, string>({
      query: (id) => ({
        url: `/requests/time-offs/${id}`,
        method: "GET",
      }),
    }),

    createTimeOff: builder.mutation<
      CustomResponse<IRequest>,
      CreateRequestTimeOffDto
    >({
      query: (body) => ({
        url: "/requests/time-offs",
        method: "POST",
        body,
      }),
    }),

    updateTimeOff: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; data: Partial<CreateRequestTimeOffDto> }
    >({
      query: ({ id, data }) => ({
        url: `/requests/time-offs/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    updateTimeOffStatus: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; action: RequestAction }
    >({
      query: ({ id, action }) => ({
        url: `/requests/time-offs/${id}/status`,
        method: "PATCH",
        body: { action },
      }),
    }),

    deleteTimeOff: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/requests/time-offs/${id}`,
        method: "DELETE",
      }),
    }),

    // Busy Schedule endpoints
    getBusySchedules: builder.query<
      CustomResponse<Pagination<IRequest[]>>,
      {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params) => ({
        url: "/requests/busy-schedules",
        method: "GET",
        params,
      }),
    }),

    getBusyScheduleById: builder.query<CustomResponse<IRequest>, string>({
      query: (id) => ({
        url: `/requests/busy-schedules/${id}`,
        method: "GET",
      }),
    }),

    createBusySchedule: builder.mutation<
      CustomResponse<IRequest>,
      CreateRequestBusyScheduleDto
    >({
      query: (body) => ({
        url: "/requests/busy-schedules",
        method: "POST",
        body,
      }),
    }),

    updateBusySchedule: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; data: Partial<CreateRequestBusyScheduleDto> }
    >({
      query: ({ id, data }) => ({
        url: `/requests/busy-schedules/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    updateBusyScheduleStatus: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; action: RequestAction }
    >({
      query: ({ id, action }) => ({
        url: `/requests/busy-schedules/${id}/status`,
        method: "PATCH",
        body: { action },
      }),
    }),

    deleteBusySchedule: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/requests/busy-schedules/${id}`,
        method: "DELETE",
      }),
    }),

    // Support Ticket endpoints
    getSupportTickets: builder.query<
      CustomResponse<Pagination<IRequest[]>>,
      {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
        priority?: string;
      }
    >({
      query: (params) => ({
        url: "/requests/support-tickets",
        method: "GET",
        params,
      }),
    }),

    getSupportTicketById: builder.query<CustomResponse<IRequest>, string>({
      query: (id) => ({
        url: `/requests/support-tickets/${id}`,
        method: "GET",
      }),
    }),

    createSupportTicket: builder.mutation<
      CustomResponse<IRequest>,
      CreateRequestSupportTicketDto
    >({
      query: (body) => ({
        url: "/requests/support-tickets",
        method: "POST",
        body,
      }),
    }),

    updateSupportTicket: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; data: Partial<CreateRequestSupportTicketDto> }
    >({
      query: ({ id, data }) => ({
        url: `/requests/support-tickets/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    updateSupportTicketStatus: builder.mutation<
      CustomResponse<IRequest>,
      { id: string; action: RequestAction }
    >({
      query: ({ id, action }) => ({
        url: `/requests/support-tickets/${id}/status`,
        method: "PATCH",
        body: { action },
      }),
    }),

    deleteSupportTicket: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/requests/support-tickets/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  // Weekly Norm hooks
  useGetWeeklyNormsQuery,
  useGetWeeklyNormByIdQuery,
  useLazyGetWeeklyNormByIdQuery,
  useCreateWeeklyNormMutation,
  useUpdateWeeklyNormMutation,
  useUpdateWeeklyNormStatusMutation,
  useDeleteWeeklyNormMutation,

  // Time Off hooks
  useGetTimeOffsQuery,
  useGetTimeOffByIdQuery,
  useLazyGetTimeOffByIdQuery,
  useCreateTimeOffMutation,
  useUpdateTimeOffMutation,
  useUpdateTimeOffStatusMutation,
  useDeleteTimeOffMutation,

  // Busy Schedule hooks
  useGetBusySchedulesQuery,
  useGetBusyScheduleByIdQuery,
  useLazyGetBusyScheduleByIdQuery,
  useCreateBusyScheduleMutation,
  useUpdateBusyScheduleMutation,
  useUpdateBusyScheduleStatusMutation,
  useDeleteBusyScheduleMutation,

  // Support Ticket hooks
  useGetSupportTicketsQuery,
  useGetSupportTicketByIdQuery,
  useLazyGetSupportTicketByIdQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
  useDeleteSupportTicketMutation,
} = requestApi;
