"use client";
import Loading from "@web/components/common/Loading";
import { NAV_LINK } from "@web/libs/nav";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const ClassDetail = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;

    router.push(NAV_LINK.CLASS_DETAIL_OVERVIEW(id));
  }, [id, router]);

  return <Loading />;
};

export default ClassDetail;
