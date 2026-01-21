"use client";
import Loading from "@web/components/common/Loading";
import { useGetClassByIdQuery } from "@web/libs/features/classes/classApi";
import { STATUS_LABEL, STATUS_TAG } from "@web/libs/user";
import { Card, Descriptions, Tag } from "antd";
import dayjs from "dayjs";
import { useParams } from "next/navigation";

const ClassOverview = () => {
  const { id } = useParams<{ id: string }>();

  const { data: classData, isLoading } = useGetClassByIdQuery(id, {
    skip: !id,
  });

  const classDetail = classData?.data;

  if (isLoading || !classDetail) return <Loading />;

  return (
    <Card title="Thông tin chung">
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Mã lớp" span={1}>
          {classDetail.code}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái" span={1}>
          <Tag color={STATUS_TAG[classDetail.status]}>
            {STATUS_LABEL[classDetail.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Tên lớp" span={2}>
          {classDetail.name}
        </Descriptions.Item>
        <Descriptions.Item label="Khóa học" span={2}>
          {classDetail.course?.name} ({classDetail.course?.code})
        </Descriptions.Item>
        <Descriptions.Item label="Giáo viên" span={1}>
          {classDetail.teacher?.fullName || ""}
        </Descriptions.Item>
        <Descriptions.Item label="Phòng học" span={1}>
          {classDetail.room?.name || ""}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày bắt đầu" span={1}>
          {classDetail.startDate
            ? dayjs(classDetail.startDate).format("DD/MM/YYYY")
            : "Không có"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày kết thúc" span={1}>
          {classDetail.endDate
            ? dayjs(classDetail.endDate).format("DD/MM/YYYY")
            : "Không có"}
        </Descriptions.Item>
        <Descriptions.Item label="Học viên" span={2}>
          {classDetail.studentClasses?.length || 0} / {classDetail.quantity} học
          viên
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả" span={2}>
          {classDetail.description || ""}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ClassOverview;
