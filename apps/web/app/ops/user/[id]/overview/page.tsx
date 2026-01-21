"use client";
import { EditOutlined } from "@ant-design/icons";
import CustomButton from "@web/components/common/CustomButton";
import Loading from "@web/components/common/Loading";
import { useGetUserByIdQuery } from "@web/libs/features/users/userApi";
import { NAV_LINK } from "@web/libs/nav";
import { ROLE_LABEL, ROLE_TAG, RoleName } from "@web/libs/role";
import { STATUS_LABEL, STATUS_TAG } from "@web/libs/user";
import { Card, Tag, Typography } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";

const UserOverview = () => {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data, isLoading } = useGetUserByIdQuery(userId);
  const user = data?.data;

  // Check if user is a student (for hiding department)
  const isStudent = user?.role?.roleName === RoleName.STUDENT;

  // Check if user is a teacher (for showing field)
  const isTeacher = [
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  ].includes(user?.role?.roleName);

  if (isLoading || !user) {
    return <Loading />;
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Typography.Title level={4} className="mb-0">
            Thông tin chung
          </Typography.Title>
          <Link href={NAV_LINK.USER_DETAIL_SETTINGS(userId)}>
            <CustomButton
              type="primary"
              title="Cập nhật thông tin"
              size="large"
              icon={<EditOutlined />}
            />
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex">
          <div className="w-1/4">
            <Typography.Text strong>Mã:</Typography.Text>
          </div>
          <div className="w-3/4">
            <Typography.Text>{user?.detail?.code || ""}</Typography.Text>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/4">
            <Typography.Text strong>Họ và tên:</Typography.Text>
          </div>
          <div className="w-3/4">
            <Typography.Text>{user?.fullName || ""}</Typography.Text>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/4">
            <Typography.Text strong>Email:</Typography.Text>
          </div>
          <div className="w-3/4">
            <Typography.Text>{user?.email || ""}</Typography.Text>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/4">
            <Typography.Text strong>Số điện thoại:</Typography.Text>
          </div>
          <div className="w-3/4">
            <Typography.Text>{user?.phoneNumber || ""}</Typography.Text>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/4">
            <Typography.Text strong>Vai trò:</Typography.Text>
          </div>
          <div className="w-3/4">
            <div>
              <Tag color={ROLE_TAG[user?.role?.roleName]}>
                {ROLE_LABEL[user?.role?.roleName]}
              </Tag>
            </div>
          </div>
        </div>

        {/* Department - show for all roles except STUDENT */}
        {!isStudent && user?.detail?.department && (
          <div className="flex">
            <div className="w-1/4">
              <Typography.Text strong>Phòng ban:</Typography.Text>
            </div>
            <div className="w-3/4">
              <Typography.Text>
                {user?.detail?.department?.name || ""}
              </Typography.Text>
            </div>
          </div>
        )}

        {/* Field - show only for teachers */}
        {isTeacher && user?.detail?.field && (
          <div className="flex">
            <div className="w-1/4">
              <Typography.Text strong>Lĩnh vực:</Typography.Text>
            </div>
            <div className="w-3/4">
              <Typography.Text>
                {user?.detail?.field?.name || ""}
              </Typography.Text>
            </div>
          </div>
        )}

        {/* Teacher Level - show only for teachers */}
        {isTeacher && user?.detail?.teacherLevel && (
          <div className="flex">
            <div className="w-1/4">
              <Typography.Text strong>Trình độ:</Typography.Text>
            </div>
            <div className="w-3/4">
              <Typography.Text>{user?.detail?.teacherLevel}</Typography.Text>
            </div>
          </div>
        )}

        <div className="mb-4 flex">
          <div className="w-1/4">
            <Typography.Text strong>Trạng thái:</Typography.Text>
          </div>
          <div className="w-3/4">
            <div>
              <Tag color={STATUS_TAG[user.status]}>
                {STATUS_LABEL[user.status]}
              </Tag>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserOverview;
