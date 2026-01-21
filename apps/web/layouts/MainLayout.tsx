"use client";
import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import React, { memo } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }: React.PropsWithChildren<{}>) => {
  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout>
        <Header />
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default memo(MainLayout);
