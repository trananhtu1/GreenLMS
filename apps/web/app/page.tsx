"use client";
import { NAV_LINK } from "@web/libs/nav";
import { getHomePathForUser } from "@web/libs/permissions";
import { RootState } from "@web/libs/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(NAV_LINK.LOGIN);
      return;
    }

    const redirectPath = getHomePathForUser(user);
    router.replace(redirectPath);
  }, [router, user, isAuthenticated]);

  return null;
}
