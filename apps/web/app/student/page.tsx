"use client";
import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import CustomButton from "@web/components/common/CustomButton";
import PageLayout from "@web/layouts/PageLayout";
import { MAX_LIMIT_REQUEST } from "@web/libs/common";
import { useGetMyClassesQuery } from "@web/libs/features/classes/classApi";
import { useGetStudentSchedulesQuery } from "@web/libs/features/schedules/scheduleApi";
import { NAV_LINK, NAV_TITLE } from "@web/libs/nav";
import { RootState } from "@web/libs/store";
import { UserStatus } from "@web/libs/user";
import {
  Avatar,
  Card,
  Col,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import Link from "next/link";
import { useMemo } from "react";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.HOME,
  },
];

const HomeStudent: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Fetch student-specific data
  const { data: myClassesData } = useGetMyClassesQuery({
    limit: MAX_LIMIT_REQUEST,
  });
  const { data: scheduleData } = useGetStudentSchedulesQuery({
    startDate: dayjs().startOf("week").toISOString(),
    endDate: dayjs().endOf("week").toISOString(),
  });

  // Calculate student statistics
  const statistics = useMemo(() => {
    const totalClasses = myClassesData?.data?.total || 0;
    const activeClasses =
      myClassesData?.data?.items?.filter(
        (cls) => cls.status === UserStatus.ACTIVE,
      ).length || 0;
    const todaySchedules =
      scheduleData?.data?.filter((schedule: any) =>
        dayjs(schedule.startDate).isSame(dayjs(), "day"),
      ).length || 0;
    const weekSchedules = scheduleData?.data?.length || 0;

    return {
      totalClasses,
      activeClasses,
      todaySchedules,
      weekSchedules,
      learningProgress:
        totalClasses > 0 ? (activeClasses / totalClasses) * 100 : 0,
    };
  }, [myClassesData, scheduleData]);

  const myClasses = useMemo(() => {
    return (
      myClassesData?.data?.items?.slice(0, 5).map((cls) => ({
        id: cls.id,
        name: cls.name,
        course: cls.course?.name,
        teacher: cls.teacher?.fullName,
        startDate: cls.startDate,
        endDate: cls.endDate,
        status: cls.status,
      })) || []
    );
  }, [myClassesData]);

  const todaySchedules = useMemo(() => {
    return (
      scheduleData?.data
        ?.filter((schedule: any) =>
          dayjs(schedule.startDate).isSame(dayjs(), "day"),
        )
        .slice(0, 5) || []
    );
  }, [scheduleData]);

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
                Hôm nay là {dayjs().format("dddd, DD/MM/YYYY")} - Chúc bạn có
                một ngày học tập hiệu quả!
              </Text>
            </div>
            <TrophyOutlined style={{ fontSize: "48px", color: "#faad14" }} />
          </div>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={NAV_TITLE.MY_STUDENT_CLASS}
                value={statistics.totalClasses}
                prefix={<BookOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={NAV_TITLE.MY_ACTIVE_CLASS}
                value={statistics.activeClasses}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tiết Học Hôm Nay"
                value={statistics.todaySchedules}
                prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* My Classes */}
          <Col xs={24} lg={12}>
            <Card
              title={NAV_TITLE.MY_STUDENT_CLASS}
              extra={
                <Link href={NAV_LINK.MY_STUDENT_CLASS}>
                  <CustomButton
                    type="link"
                    title="Xem tất cả"
                    icon={<EyeOutlined />}
                  />
                </Link>
              }
            >
              <List
                dataSource={myClasses}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Link
                        href={NAV_LINK.MY_TEACHER_CLASS_DETAIL_OVERVIEW(
                          item.id,
                        )}
                        key="view"
                      >
                        <CustomButton
                          type="link"
                          size="small"
                          title="Xem"
                          icon={<EyeOutlined />}
                        />
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<BookOutlined />}
                          style={{ backgroundColor: "#1890ff" }}
                        />
                      }
                      title={
                        <Space>
                          {item.name}
                          <Tag
                            color={
                              item.status === UserStatus.ACTIVE
                                ? "green"
                                : "red"
                            }
                          >
                            {item.status === UserStatus.ACTIVE
                              ? "Hoạt động"
                              : "Tạm dừng"}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>Khóa học: {item.course || "Chưa có"}</div>
                          <div className="mt-1 flex items-center gap-1">
                            <ClockCircleOutlined style={{ fontSize: "12px" }} />
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {item.startDate
                                ? dayjs(item.startDate).format("DD/MM/YYYY")
                                : "Chưa có lịch"}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Today's Schedule */}
          <Col xs={24} lg={12}>
            <Card
              title="Lịch học hôm nay"
              extra={
                <Link href={NAV_LINK.MY_TEACHER_CALENDAR}>
                  <CustomButton
                    type="link"
                    title="Xem lịch đầy đủ"
                    icon={<CalendarOutlined />}
                  />
                </Link>
              }
            >
              {todaySchedules.length > 0 ? (
                <List
                  dataSource={todaySchedules}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<ClockCircleOutlined />}
                            style={{ backgroundColor: "#faad14" }}
                          />
                        }
                        title={item.name}
                        description={
                          <div>
                            <div>
                              {dayjs(item.startDate).format("HH:mm")} -{" "}
                              {dayjs(item.endDate).format("HH:mm")}
                            </div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {item.description || "Không có mô tả"}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div className="py-8 text-center">
                  <ClockCircleOutlined
                    style={{ fontSize: "48px", color: "#d9d9d9" }}
                  />
                  <div className="mt-4">
                    <Text type="secondary">Không có lịch dạy hôm nay</Text>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </PageLayout>
  );
};

export default HomeStudent;
