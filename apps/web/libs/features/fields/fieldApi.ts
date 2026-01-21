import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse, Pagination } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import { CreateFieldDto, IField } from "@web/libs/field";

export const fieldApi = createApi({
  reducerPath: "fieldApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    getFields: builder.query<
      CustomResponse<Pagination<IField[]>>,
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/fields",
        method: "GET",
        params,
      }),
    }),

    createField: builder.mutation<CustomResponse<IField>, CreateFieldDto>({
      query: (body) => ({
        url: "/fields",
        method: "POST",
        body,
      }),
    }),

    updateField: builder.mutation<
      CustomResponse<IField>,
      { id: string; data: CreateFieldDto }
    >({
      query: ({ id, data }) => ({
        url: `/fields/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    deleteField: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/fields/${id}`,
        method: "DELETE",
      }),
    }),

    getFieldById: builder.query<CustomResponse<IField>, string>({
      query: (id) => ({
        url: `/fields/${id}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetFieldsQuery,
  useCreateFieldMutation,
  useUpdateFieldMutation,
  useDeleteFieldMutation,
  useGetFieldByIdQuery,
  useLazyGetFieldByIdQuery,
} = fieldApi;
