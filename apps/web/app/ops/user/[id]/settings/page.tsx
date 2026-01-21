"use client";
import { CloseOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import Loading from "@web/components/common/Loading";
import { useDebouncedSelect } from "@web/hooks/useDebouncedSelect";
import { useGetDepartmentsQuery } from "@web/libs/features/departments/departmentApi";
import { useGetFieldsQuery } from "@web/libs/features/fields/fieldApi";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@web/libs/features/users/userApi";
import { NAV_LINK } from "@web/libs/nav";
import {
  ManagerRoleOptions,
  RoleName,
  RoleOptions,
  StaffRoleOptions,
  TeacherRoleOptions,
} from "@web/libs/role";
import {
  StatusOptions,
  TeacherLevel,
  TeacherLevelOptions,
  UserStatus,
} from "@web/libs/user";
import { Card, Typography, Upload } from "antd";
import { UploadFile } from "antd/es/upload";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// Define Zod schema for user settings validation
const userSettingsSchema = z.object({
  code: z.string().min(1, "Code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  roleName: z.nativeEnum(RoleName, { required_error: "Role is required" }),
  status: z.nativeEnum(UserStatus, { required_error: "Status is required" }),
  departmentId: z.string().optional(),
  fieldId: z.string().optional(),
  teacherLevel: z.nativeEnum(TeacherLevel).nullable().optional(),
});

// Define type from schema
type UserSettingsFormValues = z.infer<typeof userSettingsSchema>;

const UserSettings = () => {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data, isLoading, refetch } = useGetUserByIdQuery(userId);
  const user = data?.data;
  const router = useRouter();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Add default options for department and field
  const departmentOptions = user?.detail?.department
    ? [
        {
          label: user.detail.department.name,
          value: user.detail.department.id,
        },
      ]
    : [];

  const fieldOptions = user?.detail?.field
    ? [
        {
          label: user.detail.field.name,
          value: user.detail.field.id,
        },
      ]
    : [];

  const { control, handleSubmit, reset, watch, formState } =
    useForm<UserSettingsFormValues>({
      resolver: zodResolver(userSettingsSchema),
    });

  // Watch the role to determine which fields to show
  const roleWatch = watch("roleName");

  // Check if user is a teacher (for showing field)
  const isTeacher =
    roleWatch?.includes(RoleName.TEACHER_FULL_TIME) ||
    roleWatch?.includes(RoleName.TEACHER_PART_TIME);

  // Check if user is a student (for hiding department)
  const isStudent = roleWatch === RoleName.STUDENT;

  // Use debounced select hooks for departments and fields
  const { selectProps: departmentSelectProps } = useDebouncedSelect({
    control,
    name: "departmentId",
    useGetDataQuery: useGetDepartmentsQuery,
    labelField: "name",
    valueField: "id",
    initialOptions: departmentOptions,
  });

  const { selectProps: fieldSelectProps } = useDebouncedSelect({
    control,
    name: "fieldId",
    useGetDataQuery: useGetFieldsQuery,
    labelField: "name",
    valueField: "id",
    initialOptions: fieldOptions,
  });

  // Get role options based on current role
  const getRoleOptions = () => {
    if (!user?.role?.roleName) return RoleOptions;

    if (
      [RoleName.TEACHER_FULL_TIME, RoleName.TEACHER_PART_TIME].includes(
        user.role.roleName,
      )
    ) {
      return TeacherRoleOptions;
    } else if (
      [
        RoleName.RECEPTIONIST,
        RoleName.STAFF_ACADEMIC,
        RoleName.STAFF_GENERAL,
      ].includes(user.role.roleName)
    ) {
      return StaffRoleOptions;
    } else if ([RoleName.ADMIN, RoleName.MANAGE].includes(user.role.roleName)) {
      return ManagerRoleOptions;
    }

    return RoleOptions;
  };

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      reset({
        code: user.detail?.code || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        roleName: user.role?.roleName,
        status: user.status,
        departmentId: user.detail?.department?.id || "",
        fieldId: user.detail?.field?.id || "",
        teacherLevel: user.detail?.teacherLevel,
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
  }, [user?.avatar, user?.id]);

  const onSubmit = async (data: UserSettingsFormValues) => {
    try {
      // Create FormData object
      const formData = new FormData();

      // Append all form values to FormData
      formData.append("code", data.code);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);

      if (data.phoneNumber) {
        formData.append("phoneNumber", data.phoneNumber);
      }

      if (data.roleName) {
        formData.append("roleName", data.roleName);
      }

      if (data.status) {
        formData.append("status", data.status);
      }

      if (data.departmentId) {
        formData.append("departmentId", data.departmentId);
      }

      if (data.fieldId) {
        formData.append("fieldId", data.fieldId);
      }

      if (data.teacherLevel) {
        formData.append("teacherLevel", data.teacherLevel);
      }

      // Add avatar file if selected
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("avatar", fileList[0].originFileObj);
      }

      await updateUser({
        id: userId,
        formData: formData,
      }).unwrap();

      toast.success("User updated successfully");
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
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

  const handleCancel = () => {
    router.push(NAV_LINK.USER_DETAIL_OVERVIEW(userId));
  };

  if (isLoading || !user) {
    return <Loading />;
  }

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
            <CustomInput
              name="firstName"
              control={control}
              size="large"
              required
            />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Tên:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput
              name="lastName"
              control={control}
              size="large"
              required
            />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Email:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput
              name="email"
              control={control}
              size="large"
              disabled
              required
            />
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
              name="roleName"
              control={control}
              size="large"
              options={getRoleOptions()}
              required
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
                placeholder="Select department"
                options={departmentSelectProps.options}
                onFocus={departmentSelectProps.onFocus}
                onPopupScroll={departmentSelectProps.onPopupScroll}
                size="large"
              />
            </div>
          </div>
        )}

        {/* Field field - show only for teachers */}
        {isTeacher && (
          <div className="flex items-center">
            <div className="w-1/4">
              <Typography.Text strong>Lĩnh vực:</Typography.Text>
            </div>
            <div className="w-3/4">
              <CustomSelect
                control={control}
                name="fieldId"
                placeholder="Select field"
                options={fieldSelectProps.options}
                onFocus={fieldSelectProps.onFocus}
                onPopupScroll={fieldSelectProps.onPopupScroll}
                size="large"
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
                placeholder="Select teacher level"
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
              required
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
          loading={isUpdating}
          disabled={isUpdating}
          onClick={handleSubmit(onSubmit)}
          icon={<SaveOutlined />}
        />
      </div>
    </Card>
  );
};

export default UserSettings;
