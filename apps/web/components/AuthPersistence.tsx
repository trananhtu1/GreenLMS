"use client";
import { useLazyGetProfileQuery } from "@web/libs/features/auth/authApi";
import { setCredentials } from "@web/libs/features/auth/authSlice";
import { getToken } from "@web/libs/tokens";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Loading from "./common/Loading";

interface AuthPersistenceProps {
  children: React.ReactNode;
}

const AuthPersistence: React.FC<AuthPersistenceProps> = ({ children }) => {
  const dispatch = useDispatch();
  const [isChecking, setIsChecking] = useState(true);
  const [fetchProfile, { data, isSuccess, isError }] = useLazyGetProfileQuery();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        await fetchProfile();
      } catch (error) {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [fetchProfile]);

  useEffect(() => {
    if (isSuccess && data?.data) {
      const token = getToken();
      dispatch(
        setCredentials({
          user: data.data,
          accessToken: token,
        }),
      );
      setIsChecking(false);
    }

    if (isError) {
      setIsChecking(false);
    }
  }, [isSuccess, isError, data, dispatch]);

  return isChecking ? <Loading /> : <>{children}</>;
};

export default AuthPersistence;
