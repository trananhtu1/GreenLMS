"use client";
import { AccessRole } from "@web/libs/common";
import { NAV_LINK } from "@web/libs/nav";
import {
  canAccessOPS,
  canAccessStudent,
  canAccessTeacher,
  getHomePathForUser,
} from "@web/libs/permissions";
import { RootState } from "@web/libs/store";
import { getToken } from "@web/libs/tokens";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredAccess?: AccessRole;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredAccess,
}) => {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();

    // If not authenticated and no token exists, redirect to login
    if (!isAuthenticated && !token) {
      router.replace(NAV_LINK.LOGIN);
      return;
    }

    // Skip access check if no requiredAccess is specified
    if (!requiredAccess) {
      return;
    }

    // If the user is authenticated, check for proper access
    if (isAuthenticated) {
      const hasAccess =
        (requiredAccess === AccessRole.TEACHER && canAccessTeacher(user)) ||
        (requiredAccess === AccessRole.OPS && canAccessOPS(user)) ||
        (requiredAccess === AccessRole.STUDENT && canAccessStudent(user));
      if (!hasAccess) {
        const redirectPath = getHomePathForUser(user);
        router.replace(redirectPath);
      }
    }
  }, [user, isAuthenticated, requiredAccess, router, pathname]);

  return <>{children}</>;
};

export default RouteGuard;
