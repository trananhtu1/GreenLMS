"use client";
import { HomeOutlined } from "@ant-design/icons";
import PageLayout from "@web/layouts/PageLayout";
import { NAV_TITLE } from "@web/libs/nav";
import { RootState } from "@web/libs/store";
import { Card, Typography } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.HOME,
  },
];

const HomeOPS = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <PageLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6">
        {/* Welcome Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">
                {`Chào mừng ${user?.fullName}!`}
              </Title>
              <Text type="secondary" className="text-lg">
                Quản lý hệ thống giáo dục hiệu quả -{" "}
                {dayjs().format("dddd, DD/MM/YYYY")}
              </Text>
            </div>
            <HomeOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default HomeOPS;
