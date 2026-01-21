"use client";
import type { RootState } from "@web/libs/store";
import { Layout } from "antd";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { useSelector } from "react-redux";
import NavigationMenu from "./NavigationMenu";

const Sidebar = () => {
  const { sidebarCollapsed } = useSelector((state: RootState) => state.layout);

  return (
    <Layout.Sider
      trigger={null}
      collapsible
      collapsed={sidebarCollapsed}
      width={250}
      className="sticky left-0 top-0 min-h-screen"
    >
      <Link href="/" className="block p-4">
        {sidebarCollapsed ? (
          <Image
            src="/logo-collapsed.svg"
            alt="Logo Collapsed"
            width={50}
            height={50}
            priority
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Logo"
            width={200}
            height={50}
            className="h-auto w-full"
            priority
          />
        )}
      </Link>
      <NavigationMenu />
    </Layout.Sider>
  );
};

export default memo(Sidebar);
