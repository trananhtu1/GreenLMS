import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse, Pagination } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import { CreateDepartmentDto, IDepartment } from "@web/libs/department";

export const departmentApi = createApi({
  reducerPath: "departmentApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    getDepartments: builder.query<
      CustomResponse<Pagination<IDepartment[]>>,
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/departments",
        method: "GET",
        params,
      }),
    }),

    createDepartment: builder.mutation<
      CustomResponse<IDepartment>,
      CreateDepartmentDto
    >({
      query: (body) => ({
        url: "/departments",
        method: "POST",
        body,
      }),
    }),

    updateDepartment: builder.mutation<
      CustomResponse<IDepartment>,
      { id: string; data: CreateDepartmentDto }
    >({
      query: ({ id, data }) => ({
        url: `/departments/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    deleteDepartment: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
    }),

    getDepartmentById: builder.query<CustomResponse<IDepartment>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentByIdQuery,
  useLazyGetDepartmentByIdQuery,
} = departmentApi;
