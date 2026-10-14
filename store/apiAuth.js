import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const apiAuth = createApi({
  reducerPath: "ApiAuth",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/user/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: "/user/register",
        method: "POST",
        body: data,
      }),
    }),
    validateUsername: builder.mutation({
      query: (data) => ({
        url: "/user/check-username",
        method: "POST",
        body: data,
      }),
    }),
    verifyUser: builder.mutation({
      query: (data) => ({
        url: "/user/verifyuser",
        method: "POST",
        body: data,
      }),
    }),
    recoverPassword: builder.mutation({
      query: (data) => ({
        url: "/user/password/recover",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/user/password/reset",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useValidateUsernameMutation,
  useVerifyUserMutation,
  useRecoverPasswordMutation,
  useResetPasswordMutation,
} = apiAuth;
