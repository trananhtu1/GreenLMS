import type { Middleware } from "@reduxjs/toolkit";
import { isRejectedWithValue } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";

/**
 * Middleware that catches rejected API calls and shows error notifications
 */
export const apiErrorMiddleware: Middleware = () => (next) => (action) => {
  // Check if the action is a rejected API call with a value
  if (isRejectedWithValue(action)) {
    const errorMessage =
      (action.payload as any)?.data?.message ||
      action.error?.message ||
      "Something went wrong";

    toast.error(errorMessage);
  }

  return next(action);
};
