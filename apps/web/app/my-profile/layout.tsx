"use client";
import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import Loading from "@web/components/common/Loading";
import RouteGuard from "@web/components/RouteGuard";
import MainLayout from "@web/layouts/MainLayout";
import PageLayout from "@web/layouts/PageLayout";
import { NAV_LINK, NAV_TITLE } from "@web/libs/nav";
import { RootState } from "@web/libs/store";
import { STATUS_LABEL, STATUS_TAG } from "@web/libs/user";
import { Avatar, Card, Tabs, Tag, Typography } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.MY_PROFILE,
  },
];

const MyProfile = ({ children }: React.PropsWithChildren) => {
  const [currentTab, setCurrentTab] = React.useState("1");
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();

  // Calculate profile completion percentage
  const totalFields = useMemo(() => {
    return user ? Object.keys(user).length - 1 : 0; // Exclude id field
  }, [user]);

  const countEmptyFields = useMemo(() => {
    return user ? Object.values(user).filter((value) => !value).length : 0;
  }, [user]);

  const percentage = useMemo(() => {
    return totalFields > 0
      ? Math.round(((totalFields - countEmptyFields) / totalFields) * 100)
      : 0;
  }, [countEmptyFields, totalFields]);

  const tabs = [
    {
      key: "1",
      label: (
        <div onClick={() => router.push(NAV_LINK.MY_PROFILE_OVERVIEW)}>
          Thông tin chung
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div onClick={() => router.push(NAV_LINK.MY_PROFILE_SETTINGS)}>
          Cập nhật thông tin
        </div>
      ),
    },
  ];

  useEffect(() => {
    switch (pathname) {
      case NAV_LINK.MY_PROFILE_OVERVIEW:
        setCurrentTab("1");
        break;
      case NAV_LINK.MY_PROFILE_SETTINGS:
        setCurrentTab("2");
        break;
      default:
        setCurrentTab("1");
    }
  }, [pathname]);

  if (!user) {
    router.replace(NAV_LINK.LOGIN);
    return <Loading />;
  }

  return (
    <RouteGuard>
      <MainLayout>
        <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MY_PROFILE}>
          <div className="my-profile flex flex-col gap-6">
            <Card>
              <div className="flex gap-6">
                <Avatar
                  shape="square"
                  size={160}
                  icon={
                    user?.avatar ? (
                      <img
                        src={user?.avatar}
                        alt="Avatar"
                        width={160}
                        height={160}
                      />
                    ) : (
                      <UserOutlined />
                    )
                  }
                />
                <div className="flex flex-col">
                  <Typography.Title level={4}>
                    {user?.fullName}
                  </Typography.Title>
                  <div className="flex gap-6">
                    <div>
                      <Tag color={STATUS_TAG[user.status]}>
                        {STATUS_LABEL[user.status]}
                      </Tag>
                    </div>
                    <div>
                      <MailOutlined />
                      <Typography.Text className="ml-2">
                        {user?.email}
                      </Typography.Text>
                    </div>
                    <div>
                      <PhoneOutlined />
                      <Typography.Text className="ml-2">
                        {user?.phoneNumber || "Không có"}
                      </Typography.Text>
                    </div>
                  </div>
                  <div className="mb-2 mt-auto w-[300px]">
                    <div className="mb-2 flex justify-between">
                      <Typography.Text>Hoàn thành</Typography.Text>
                      <Typography.Text>{percentage}%</Typography.Text>
                    </div>
                    <div className="h-1 w-full rounded bg-gray-200">
                      <div
                        className="h-1 rounded bg-blue-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Tabs
                size="large"
                items={tabs}
                className="mt-4"
                activeKey={currentTab}
              />
            </Card>
            {children}
          </div>
        </PageLayout>
      </MainLayout>
    </RouteGuard>
  );
};

export default MyProfile;
