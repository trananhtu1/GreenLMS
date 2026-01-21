"use client";
import { HomeFilled } from "@ant-design/icons";
import { Breadcrumb, Layout, Typography } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { memo } from "react";

interface PageLayoutProps extends React.PropsWithChildren {
  breadcrumbs: ItemType[];
  title?: string;
}

const PageLayout = ({ children, breadcrumbs, title }: PageLayoutProps) => {
  return (
    <Layout className="px-10 pb-8 pt-2">
      <div className="container mx-auto">
        <Breadcrumb
          className="my-4"
          items={[
            {
              href: "#",
              title: <HomeFilled />,
            },
            ...breadcrumbs,
          ]}
        />
        {title && (
          <Typography.Title level={3} className="mb-4">
            {title}
          </Typography.Title>
        )}
        {children}
      </div>
    </Layout>
  );
};

export default memo(PageLayout);
