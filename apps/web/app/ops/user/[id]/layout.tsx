"use client";
import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import Loading from "@web/components/common/Loading";
import PageLayout from "@web/layouts/PageLayout";
import { useGetUserByIdQuery } from "@web/libs/features/users/userApi";
import { NAV_LINK, NAV_TITLE } from "@web/libs/nav";
import { ROLE_LABEL, ROLE_TAG } from "@web/libs/role";
import { STATUS_LABEL, STATUS_TAG } from "@web/libs/user";
import { Avatar, Card, Tabs, Tag, Typography } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";

const UserDetailLayout = ({ children }: React.PropsWithChildren) => {
  const [currentTab, setCurrentTab] = React.useState("1");
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data, isLoading } = useGetUserByIdQuery(userId);
  const user = data?.data;
  const router = useRouter();
  const pathname = usePathname();

  const breadcrumbs: ItemType[] = [
    {
      href: "#",
      title: NAV_TITLE.MANAGE_USERS,
    },
    {
      title: user ? `${user.fullName}` : NAV_TITLE.USER_DETAIL,
    },
  ];

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
        <div onClick={() => router.push(NAV_LINK.USER_DETAIL_OVERVIEW(userId))}>
          Thông tin chung
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div onClick={() => router.push(NAV_LINK.USER_DETAIL_SETTINGS(userId))}>
          Cập nhật thông tin
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (pathname.includes("/overview")) {
      setCurrentTab("1");
    } else if (pathname.includes("/settings")) {
      setCurrentTab("2");
    } else {
      setCurrentTab("1");
    }
  }, [pathname]);

  if (isLoading || !user) {
    return <Loading />;
  }

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      title={`Thông tin người dùng: ${user.fullName}`}
    >
      <div className="user-detail flex flex-col gap-6">
        <Card>
          <div className="flex gap-6">
            <Avatar
              shape="square"
              size={160}
              icon={
                user?.avatar ? (
                  <img
                    src={user.avatar}
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
              <Typography.Title level={4}>{user.fullName}</Typography.Title>
              <div className="flex gap-6">
                <div>
                  <Tag color={STATUS_TAG[user.status]}>
                    {STATUS_LABEL[user.status]}
                  </Tag>
                </div>
                <div>
                  <Tag color={ROLE_TAG[user.role.roleName]}>
                    {ROLE_LABEL[user.role.roleName]}
                  </Tag>
                </div>
                <div>
                  <MailOutlined />
                  <Typography.Text className="ml-2">
                    {user.email}
                  </Typography.Text>
                </div>
                <div>
                  <PhoneOutlined />
                  <Typography.Text className="ml-2">
                    {user.phoneNumber || "Không có"}
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
  );
};

export default UserDetailLayout;
