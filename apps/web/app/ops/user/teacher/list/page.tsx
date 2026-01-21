"use client";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomDrawer from "@web/components/common/CustomDrawer";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import { useDebouncedSelect } from "@web/hooks/useDebouncedSelect";
import PageLayout from "@web/layouts/PageLayout";
import { DATE_TIME_FORMAT, TableColumn } from "@web/libs/common";
import { useGetDepartmentsQuery } from "@web/libs/features/departments/departmentApi";
import { useGetFieldsQuery } from "@web/libs/features/fields/fieldApi";
import {
  closeCreateModal,
  openCreateModal,
} from "@web/libs/features/table/tableSlice";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetTeachersQuery,
  useUpdateUserStatusMutation,
} from "@web/libs/features/users/userApi";
import { NAV_LINK, NAV_TITLE } from "@web/libs/nav";
import {
  ROLE_LABEL,
  ROLE_TAG,
  RoleName,
  TeacherRoleOptions,
} from "@web/libs/role";
import { RootState } from "@web/libs/store";
import {
  IDetailUser,
  IRole,
  IUser,
  STATUS_LABEL,
  STATUS_TAG,
  StatusOptions,
  TeacherLevel,
  TeacherLevelOptions,
  UserStatus,
} from "@web/libs/user";
import { Card, Modal, Table, TablePaginationConfig, Tag } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

const breadcrumbs: ItemType[] = [
  {
    href: "#",
    title: NAV_TITLE.MANAGE_USERS,
  },
  {
    title: NAV_TITLE.TEACHER_LIST,
  },
];

const columnsTitles: TableColumn<IUser>[] = [
  {
    title: "STT",
    dataIndex: "index",
  },
  {
    title: "Mã",
    dataIndex: "detail",
    render: (detail: IDetailUser) => detail.code,
  },
  {
    title: "Họ và tên",
    dataIndex: "fullName",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
  },
  {
    title: "Loại giáo viên",
    dataIndex: "role",
    render: (role: IRole) => (
      <Tag color={ROLE_TAG[role.roleName]}>{ROLE_LABEL[role.roleName]}</Tag>
    ),
  },
  {
    title: "Chuyên ngành",
    dataIndex: "detail",
    render: (detail: IDetailUser) => detail?.field?.name,
  },
  {
    title: "Phòng ban",
    dataIndex: "detail",
    render: (detail: IDetailUser) => detail?.department?.name,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: (status: UserStatus) => (
      <Tag color={STATUS_TAG[status]}>{STATUS_LABEL[status]}</Tag>
    ),
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    render: (date: string) => dayjs(date).format(DATE_TIME_FORMAT),
  },
  {
    title: "Ngày cập nhật",
    dataIndex: "updatedAt",
    render: (date: string) => dayjs(date).format(DATE_TIME_FORMAT),
  },
  {
    title: "",
    dataIndex: "method",
    fixed: "right",
  },
];

const searchSchema = z.object({
  search: z.string().optional(),
  roleName: z.string().optional(),
  status: z.string().optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

// Define Zod schema for teacher form validation
const teacherFormSchema = z
  .object({
    firstName: z.string().min(1, "Họ là bắt buộc"),
    lastName: z.string().min(1, "Tên là bắt buộc"),
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    roleName: z.nativeEnum(RoleName, { required_error: "Vai trò là bắt buộc" }),
    status: z.nativeEnum(UserStatus).optional(),
    departmentId: z.string().optional(),
    fieldId: z.string().optional(),
    teacherLevel: z.nativeEnum(TeacherLevel, {
      required_error: "Trình độ giáo viên là bắt buộc",
    }),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

// Define type from schema
type TeacherFormValues = z.infer<typeof teacherFormSchema>;

const TeacherActions = ({
  record,
  onEdit,
  onDelete,
  onView,
  onLock,
  onUnlock,
}: {
  record: IUser;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
}) => {
  return (
    <CustomDropdown>
      <CustomButton
        type="link"
        title="Xem"
        icon={<EyeOutlined />}
        onClick={() => onView(record.id)}
      />
      <CustomButton
        type="link"
        title="Cập nhật"
        icon={<EditOutlined />}
        onClick={() => onEdit(record.id)}
      />
      {record.status === UserStatus.ACTIVE && (
        <CustomButton
          type="link"
          title="Khóa"
          color="orange"
          icon={<LockOutlined />}
          onClick={() => onLock(record.id)}
        />
      )}
      {record.status === UserStatus.BLOCKED && (
        <CustomButton
          type="link"
          title="Mở khóa"
          color="green"
          icon={<UnlockOutlined />}
          onClick={() => onUnlock(record.id)}
        />
      )}
      <CustomButton
        type="link"
        title="Xóa"
        color="danger"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(record.id)}
      />
    </CustomDropdown>
  );
};

const Teachers = () => {
  const router = useRouter();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    defaultCurrent: 1,
    defaultPageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
  });
  const [searchParams, setSearchParams] = useState<{
    search?: string;
    roleName?: string;
    status?: string;
    page?: number;
    limit?: number;
  }>({
    page: 1,
    limit: 10,
  });
  const { isOpenCreateModal } = useSelector((state: RootState) => state.table);
  const dispatch = useDispatch();

  // Search form
  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  // Teacher form with validation
  const teacherForm = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      roleName: RoleName.TEACHER_FULL_TIME,
      status: UserStatus.ACTIVE,
      departmentId: "",
      fieldId: "",
      teacherLevel: TeacherLevel.A1,
    },
  });

  // Use debounced select hooks for departments and fields
  const { selectProps: departmentSelectProps } = useDebouncedSelect({
    control: teacherForm.control,
    name: "departmentId",
    useGetDataQuery: useGetDepartmentsQuery,
    labelField: "name",
  });

  const { selectProps: fieldSelectProps } = useDebouncedSelect({
    control: teacherForm.control,
    name: "fieldId",
    useGetDataQuery: useGetFieldsQuery,
    labelField: "name",
  });

  const { data, isFetching, refetch } = useGetTeachersQuery(searchParams);
  const [createTeacher, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteTeacher, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] =
    useUpdateUserStatusMutation();

  const { current, pageSize } = pagination;

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          render: (record: IUser) => {
            return (
              <TeacherActions
                record={record}
                onEdit={handleEditTeacher}
                onDelete={handleDeleteTeacher}
                onView={handleViewTeacher}
                onLock={handleLockUser}
                onUnlock={handleUnlockUser}
              />
            );
          },
          key: index,
        };
      }
      if (item.dataIndex === "fullName") {
        return {
          ...item,
          render: (fullName: string, record: IUser) => (
            <CustomTooltip title={fullName}>
              <span
                className="cursor-pointer text-blue-500 hover:text-blue-700"
                onClick={() => handleViewTeacher(record.id)}
              >
                {fullName}
              </span>
            </CustomTooltip>
          ),
          key: index,
        };
      }
      return {
        ...item,
        key: index,
      };
    });
  }, []);

  const tableData = useMemo(() => {
    return (
      data?.data?.items.map((item, index) => ({
        ...item,
        index: ((current || 1) - 1) * (pageSize || 10) + index + 1,
        method: item,
      })) || []
    );
  }, [data, current, pageSize]);

  const onSubmitSearch = (formData: SearchFormData) => {
    setSearchParams({
      ...searchParams,
      ...formData,
      page: 1, // Reset to first page on new search
    });
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const handleReset = () => {
    searchForm.reset();
    setSearchParams({
      page: 1,
      limit: pagination.pageSize || 10,
    });
    setPagination({
      ...pagination,
      current: 1,
    });
    refetch();
  };

  const handleEditTeacher = (id: string) => {
    router.push(NAV_LINK.USER_DETAIL_SETTINGS(id));
  };

  const handleDeleteTeacher = (id: string) => {
    Modal.confirm({
      title: "Xóa giáo viên",
      content: "Bạn có chắc chắn muốn xóa giáo viên này?",
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await deleteTeacher(id).unwrap();
          toast.success("Giáo viên đã được xóa thành công");
          refetch();
        } catch (error) {
          // Handled by the apiErrorMiddleware
        }
      },
    });
  };

  const handleViewTeacher = (id: string) => {
    router.push(NAV_LINK.USER_DETAIL_OVERVIEW(id));
  };

  const handleLockUser = (id: string) => {
    Modal.confirm({
      title: "Khóa giáo viên",
      content: "Bạn có chắc chắn muốn khóa giáo viên này?",
      onOk: async () => {
        try {
          await updateUserStatus({ id, status: UserStatus.BLOCKED }).unwrap();
          toast.success("Giáo viên đã được khóa thành công");
          refetch();
        } catch (error) {
          toast.error("Không thể khóa giáo viên");
        }
      },
    });
  };

  const handleUnlockUser = (id: string) => {
    Modal.confirm({
      title: "Mở khóa giáo viên",
      content: "Bạn có chắc chắn muốn mở khóa giáo viên này?",
      onOk: async () => {
        try {
          await updateUserStatus({ id, status: UserStatus.ACTIVE }).unwrap();
          toast.success("Giáo viên đã được mở khóa thành công");
          refetch();
        } catch (error) {
          toast.error("Không thể mở khóa giáo viên");
        }
      },
    });
  };

  const onSubmitCreate = async (data: TeacherFormValues) => {
    try {
      // Create FormData object
      const formData = new FormData();

      // Append all form values to FormData
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);

      if (data.password) {
        formData.append("password", data.password);
      }

      if (data.confirmPassword) {
        formData.append("confirmPassword", data.confirmPassword);
      }

      if (data.phoneNumber) {
        formData.append("phoneNumber", data.phoneNumber);
      }

      if (data.status) {
        formData.append("status", data.status);
      }

      if (data.roleName) {
        formData.append("roleName", data.roleName);
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

      // Submit FormData
      await createTeacher(formData).unwrap();
      toast.success("Giáo viên đã được tạo thành công");

      handleCloseDrawer();
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCloseDrawer = () => {
    dispatch(closeCreateModal());
    teacherForm.reset({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      roleName: RoleName.TEACHER_FULL_TIME,
      status: UserStatus.ACTIVE,
      departmentId: "",
      fieldId: "",
      teacherLevel: TeacherLevel.A1,
    });
  };

  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
    setSearchParams({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.TEACHER_LIST}>
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="search"
                size="large"
                placeholder="Tìm kiếm theo tên, email hoặc mã"
              />
              <CustomSelect
                control={searchForm.control}
                name="roleName"
                size="large"
                placeholder="Lọc theo loại giáo viên"
                options={TeacherRoleOptions}
              />
              <CustomSelect
                control={searchForm.control}
                name="status"
                size="large"
                placeholder="Lọc theo trạng thái"
                options={StatusOptions}
              />
            </FilterGrid>
            <div className="flex justify-between">
              <div className="flex gap-4">
                <CustomButton
                  title="Làm mới"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                />
                <CustomButton
                  type="primary"
                  title="Tìm kiếm"
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={searchForm.handleSubmit(onSubmitSearch)}
                />
              </div>
              <CustomButton
                type="primary"
                title="Thêm giáo viên"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => dispatch(openCreateModal())}
              />
            </div>
          </div>
        </Card>
        <Card>
          <Table
            loading={isFetching}
            rowKey={(record) => record.id}
            columns={tableColumns}
            dataSource={tableData}
            scroll={{ x: "max-content" }}
            pagination={pagination}
            onChange={handlePaginationChange}
          />
        </Card>
      </div>

      <CustomDrawer
        title="Thêm giáo viên"
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={teacherForm.handleSubmit(onSubmitCreate)}
        loading={isCreating}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={teacherForm.control}
            name="firstName"
            label="Họ"
            placeholder="Nhập họ"
            required
          />

          <CustomInput
            control={teacherForm.control}
            name="lastName"
            label="Tên"
            placeholder="Nhập tên"
            required
          />

          <CustomInput
            control={teacherForm.control}
            name="email"
            label="Email"
            placeholder="Nhập email"
            required
            autoComplete="off"
          />

          <CustomInput
            control={teacherForm.control}
            name="password"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            type="password"
            required
            autoComplete="new-password"
          />

          <CustomInput
            control={teacherForm.control}
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            placeholder="Xác nhận mật khẩu"
            type="password"
            required
            autoComplete="new-password"
          />

          <CustomInput
            control={teacherForm.control}
            name="phoneNumber"
            label="Số điện thoại"
            placeholder="Nhập số điện thoại (tùy chọn)"
          />

          {/* Department selection */}
          <CustomSelect
            control={teacherForm.control}
            name="departmentId"
            label="Phòng ban"
            placeholder="Chọn phòng ban"
            options={departmentSelectProps.options}
            onFocus={departmentSelectProps.onFocus}
            onPopupScroll={departmentSelectProps.onPopupScroll}
          />

          {/* Field selection - specific to teachers */}
          <CustomSelect
            control={teacherForm.control}
            name="fieldId"
            label="Chuyên ngành"
            placeholder="Chọn chuyên ngành"
            options={fieldSelectProps.options}
            onFocus={fieldSelectProps.onFocus}
            onPopupScroll={fieldSelectProps.onPopupScroll}
          />

          {/* Teacher level selection */}
          <CustomSelect
            control={teacherForm.control}
            name="teacherLevel"
            label="Trình độ giáo viên"
            placeholder="Chọn trình độ giáo viên"
            options={TeacherLevelOptions}
            required
          />

          <CustomSelect
            control={teacherForm.control}
            name="roleName"
            label="Loại giáo viên"
            placeholder="Chọn loại giáo viên"
            options={TeacherRoleOptions}
            required
          />

          <CustomSelect
            control={teacherForm.control}
            name="status"
            label="Trạng thái"
            placeholder="Chọn trạng thái"
            options={StatusOptions}
            required
          />
        </div>
      </CustomDrawer>
    </PageLayout>
  );
};

export default Teachers;
