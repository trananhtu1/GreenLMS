import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateClassDto,
  IClass,
  QueryClassDto,
  UpdateClassDto,
} from "@web/libs/class";
import { CustomResponse, Pagination } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import { ISchedule } from "@web/libs/schedule";
import { IStudentClass } from "@web/libs/student-class";
import { IUser, UserStatus } from "@web/libs/user";

export const classApi = createApi({
  reducerPath: "classApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    getClasses: builder.query<
      CustomResponse<Pagination<IClass[]>>,
      QueryClassDto
    >({
      query: (params) => ({
        url: "/classes",
        method: "GET",
        params,
      }),
    }),

    createClass: builder.mutation<CustomResponse<IClass>, CreateClassDto>({
      query: (body) => ({
        url: "/classes",
        method: "POST",
        body,
      }),
    }),

    updateClass: builder.mutation<
      CustomResponse<IClass>,
      { id: string; data: UpdateClassDto }
    >({
      query: ({ id, data }) => ({
        url: `/classes/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    deleteClass: builder.mutation<CustomResponse<void>, string>({
      query: (id) => ({
        url: `/classes/${id}`,
        method: "DELETE",
      }),
    }),

    getClassById: builder.query<CustomResponse<IClass>, string>({
      query: (id) => ({
        url: `/classes/${id}`,
        method: "GET",
      }),
    }),

    getClassSchedules: builder.query<
      CustomResponse<ISchedule[]>,
      { classId: string; startDate?: string; endDate?: string }
    >({
      query: ({ classId, startDate, endDate }) => ({
        url: `/classes/${classId}/schedules`,
        method: "GET",
        params: { startDate, endDate },
      }),
    }),

    getClassStudents: builder.query<
      CustomResponse<IStudentClass[]>,
      { classId: string }
    >({
      query: ({ classId }) => ({
        url: `/classes/${classId}/students`,
        method: "GET",
      }),
    }),

    getAvailableStudents: builder.query<
      CustomResponse<Pagination<IUser[]>>,
      {
        page?: number;
        limit?: number;
        search?: string;
        classId?: string;
        status?: UserStatus;
      }
    >({
      query: (params) => ({
        url: "/classes/students/available",
        method: "GET",
        params,
      }),
    }),

    addStudentToClass: builder.mutation<
      CustomResponse<void>,
      { classId: string; studentId: string }
    >({
      query: ({ classId, studentId }) => ({
        url: `/classes/${classId}/students/${studentId}`,
        method: "POST",
      }),
    }),

    removeStudentFromClass: builder.mutation<
      CustomResponse<void>,
      { classId: string; studentId: string }
    >({
      query: ({ classId, studentId }) => ({
        url: `/classes/${classId}/students/${studentId}`,
        method: "DELETE",
      }),
    }),

    updateStudentStatus: builder.mutation<
      CustomResponse<IStudentClass>,
      { studentClassId: string; status: UserStatus }
    >({
      query: ({ studentClassId, status }) => ({
        url: `/classes/students/${studentClassId}/status`,
        method: "PATCH",
        body: { status },
      }),
    }),

    getMyClasses: builder.query<
      CustomResponse<Pagination<IClass[]>>,
      QueryClassDto
    >({
      query: (params) => ({
        url: "/classes/my-classes",
        method: "GET",
        params,
      }),
    }),
  }),
});

export const {
  useGetClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetClassByIdQuery,
  useLazyGetClassByIdQuery,
  useGetClassSchedulesQuery,
  useGetClassStudentsQuery,
  useGetAvailableStudentsQuery,
  useAddStudentToClassMutation,
  useRemoveStudentFromClassMutation,
  useUpdateStudentStatusMutation,
  useGetMyClassesQuery,
} = classApi;
