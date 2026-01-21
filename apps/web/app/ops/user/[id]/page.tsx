"use client";
import Loading from "@web/components/common/Loading";
import { NAV_LINK } from "@web/libs/nav";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const UserDetail = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params.id;

  useEffect(() => {
    router.push(NAV_LINK.USER_DETAIL_OVERVIEW(userId));
  }, [userId, router]);

  return <Loading />;
};

export default UserDetail;
