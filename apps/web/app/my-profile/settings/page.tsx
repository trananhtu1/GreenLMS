"use client";

import { CloseOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import { useUpdateProfileMutation } from "@web/libs/features/auth/authApi";
import { RoleName, RoleOptions } from "@web/libs/role";
import { RootState } from "@web/libs/store";
import { StatusOptions, TeacherLevelOptions, UserStatus } from "@web/libs/user";
import { Card, Typography, Upload } from "antd";
import { UploadFile } from "antd/es/upload";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { z } from "zod";

// Define schema for form validation
const profileFormSchema = z.object({
  code: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  departmentId: z.string().optional(),
  fieldId: z.string().optional(),
  teacherLevel: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const MyProfileSettings = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const router = useRouter();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Check if user is a teacher
  const isTeacher = [
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  ].includes(user?.role?.roleName);

  // Check if user is a student
  const isStudent = user?.role?.roleName === RoleName.STUDENT;

  const { control, handleSubmit, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      code: user?.detail?.code ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      departmentId: user?.detail?.department?.id ?? "",
      fieldId: user?.detail?.field?.id ?? "",
      teacherLevel: user?.detail?.teacherLevel ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        code: user?.detail?.code ?? "",
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        email: user?.email ?? "",
        phoneNumber: user?.phoneNumber ?? "",
        departmentId: user?.detail?.department?.id ?? "",
        fieldId: user?.detail?.field?.id ?? "",
        teacherLevel: user?.detail?.teacherLevel ?? "",
      });
    }
  }, [user, reset]);

  // Set up the initial file list if user has an avatar
  useEffect(() => {
    if (user?.avatar) {
      setFileList([
        {
          uid: user.id,
          url: user.avatar,
          name: user.avatar,
        },
      ]);
    }
  }, [user.avatar, user.id]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("phoneNumber", data.phoneNumber || "");

      // Add avatar file if selected
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("avatar", fileList[0].originFileObj);
      }

      await updateProfile(formData);
      toast.success("Update profile successfully");
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCancel = () => {
    reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    });
    router.push("/my-profile");
  };

  // Handle file upload
  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    const newFileList = fileList.slice(-1);

    // Validate file type
    if (newFileList.length > 0) {
      const file = newFileList[0];
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng && file.status !== "removed") {
        return toast.error("You can only upload JPG/PNG file!");
      }

      // Validate file size (5MB)
      const isLt5M = file.size ? file.size / 1024 / 1024 < 5 : true;
      if (!isLt5M && file.status !== "removed") {
        return toast.error("Image must smaller than 5MB!");
      }
    }

    setFileList(newFileList);
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Typography.Title level={4} className="mb-0">
            Cập nhật thông tin
          </Typography.Title>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Ảnh đại diện:</Typography.Text>
          </div>
          <div className="w-3/4">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/png, image/jpeg"
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải lên</div>
                </div>
              )}
            </Upload>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Mã:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput name="code" control={control} size="large" disabled />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Họ:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput name="firstName" control={control} size="large" />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Tên:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput name="lastName" control={control} size="large" />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Email:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput name="email" control={control} size="large" disabled />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Số điện thoại:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput name="phoneNumber" control={control} size="large" />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Vai trò:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomSelect
              name="role"
              control={control}
              size="large"
              options={RoleOptions}
              defaultValue={user?.role?.roleName}
              disabled
            />
          </div>
        </div>

        {/* Department field - show for all roles except STUDENT */}
        {!isStudent && (
          <div className="flex items-center">
            <div className="w-1/4">
              <Typography.Text strong>Phòng ban:</Typography.Text>
            </div>
            <div className="w-3/4">
              <CustomSelect
                control={control}
                name="departmentId"
                placeholder="Chọn phòng ban"
                size="large"
                options={[
                  {
                    label: user?.detail?.department?.name,
                    value: user?.detail?.department?.id,
                  },
                ]}
                disabled
              />
            </div>
          </div>
        )}

        {/* Field field - show only for teachers */}
        {isTeacher && (
          <div className="flex items-center">
            <div className="w-1/4">
              <Typography.Text strong>Chuyên ngành:</Typography.Text>
            </div>
            <div className="w-3/4">
              <CustomSelect
                control={control}
                name="fieldId"
                placeholder="Chọn chuyên ngành"
                size="large"
                options={[
                  {
                    label: user?.detail?.field?.name,
                    value: user?.detail?.field?.id,
                  },
                ]}
                disabled
              />
            </div>
          </div>
        )}

        {/* Teacher Level - show only for teachers */}
        {isTeacher && (
          <div className="flex items-center">
            <div className="w-1/4">
              <Typography.Text strong>Trình độ:</Typography.Text>
            </div>
            <div className="w-3/4">
              <CustomSelect
                name="teacherLevel"
                control={control}
                size="large"
                options={TeacherLevelOptions}
                placeholder="Chọn trình độ"
                disabled
              />
            </div>
          </div>
        )}

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Trạng thái:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomSelect
              name="status"
              control={control}
              size="large"
              options={StatusOptions}
              defaultValue={
                user?.status ? UserStatus.ACTIVE : UserStatus.BLOCKED
              }
              disabled
            />
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-4">
        <CustomButton
          title="Hủy bỏ"
          size="large"
          icon={<CloseOutlined />}
          onClick={handleCancel}
        />
        <CustomButton
          type="primary"
          title="Lưu"
          size="large"
          loading={isLoading}
          disabled={isLoading}
          icon={<SaveOutlined />}
          onClick={handleSubmit(onSubmit)}
        />
      </div>
    </Card>
  );
};

export default MyProfileSettings;
