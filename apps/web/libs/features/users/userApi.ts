import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse, Pagination } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import { IUser, UserStatus } from "@web/libs/user";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    createUser: builder.mutation<CustomResponse<IUser>, FormData>({
      query: (formData) => ({
        url: "/users",
        method: "POST",
        body: formData,
        formData: true,
      }),
    }),
    updateUser: builder.mutation<
      CustomResponse<IUser>,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
    }),
    deleteUser: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
    }),
    updateUserStatus: builder.mutation<
      CustomResponse<IUser>,
      { id: string; status: UserStatus }
    >({
      query: ({ id, status }) => ({
        url: `/users/${id}/update-status`,
        method: "PATCH",
        body: { status },
      }),
    }),
    getTeachers: builder.query<
      CustomResponse<Pagination<IUser[]>>,
      { search?: string; roleName?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/users/teachers",
        method: "GET",
        params,
      }),
    }),
    getStudents: builder.query<
      CustomResponse<Pagination<IUser[]>>,
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/users/students",
        method: "GET",
        params,
      }),
    }),
    getStaffs: builder.query<
      CustomResponse<Pagination<IUser[]>>,
      { search?: string; roleName?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/users/staffs",
        method: "GET",
        params,
      }),
    }),
    getManagers: builder.query<
      CustomResponse<Pagination<IUser[]>>,
      { search?: string; roleName?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/users/managers",
        method: "GET",
        params,
      }),
    }),
    getUserById: builder.query<CustomResponse<IUser>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useGetStudentsQuery,
  useGetStaffsQuery,
  useGetManagersQuery,
  useGetUserByIdQuery,
} = userApi;
