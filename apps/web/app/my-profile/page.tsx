"use client";
import Loading from "@web/components/common/Loading";
import { NAV_LINK } from "@web/libs/nav";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MyProfile = () => {
  const router = useRouter();

  useEffect(() => {
    router.push(NAV_LINK.MY_PROFILE_OVERVIEW);
  }, []);

  return <Loading />;
};

export default MyProfile;
