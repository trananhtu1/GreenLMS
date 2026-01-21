import { createApi } from "@reduxjs/toolkit/query/react";
import { CustomResponse } from "@web/libs/common";
import { baseFetchQuery } from "@web/libs/customBaseQuery";
import { IWeeklyNorm } from "@web/libs/weekly-norm";

export const weeklyNormApi = createApi({
  reducerPath: "weeklyNormApi",
  baseQuery: baseFetchQuery,
  endpoints: (builder) => ({
    getWeeklyNorms: builder.query<
      CustomResponse<IWeeklyNorm[]>,
      { startDate: string; endDate: string; teacherId?: string }
    >({
      query: ({ startDate, endDate, teacherId }) => ({
        url: "/weekly-norms",
        params: {
          startDate,
          endDate,
          teacherId,
        },
      }),
    }),
  }),
});

export const { useGetWeeklyNormsQuery } = weeklyNormApi;
