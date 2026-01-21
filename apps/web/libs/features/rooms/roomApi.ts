import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse, Pagination } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import { CreateRoomDto, IRoom } from "@web/libs/room";

export const roomApi = createApi({
  reducerPath: "roomApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    getRooms: builder.query<
      CustomResponse<Pagination<IRoom[]>>,
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/rooms",
        method: "GET",
        params,
      }),
    }),

    createRoom: builder.mutation<CustomResponse<IRoom>, CreateRoomDto>({
      query: (body) => ({
        url: "/rooms",
        method: "POST",
        body,
      }),
    }),

    updateRoom: builder.mutation<
      CustomResponse<IRoom>,
      { id: string; data: CreateRoomDto }
    >({
      query: ({ id, data }) => ({
        url: `/rooms/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    deleteRoom: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/rooms/${id}`,
        method: "DELETE",
      }),
    }),

    getRoomById: builder.query<CustomResponse<IRoom>, string>({
      query: (id) => ({
        url: `/rooms/${id}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useGetRoomByIdQuery,
  useLazyGetRoomByIdQuery,
} = roomApi;
