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
import {
  closeCreateModal,
  openCreateModal,
} from "@web/libs/features/table/tableSlice";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetManagersQuery,
  useUpdateUserStatusMutation,
} from "@web/libs/features/users/userApi";
import { NAV_LINK, NAV_TITLE } from "@web/libs/nav";
import {
  ManagerRoleOptions,
  ROLE_LABEL,
  ROLE_TAG,
  RoleName,
} from "@web/libs/role";
import { RootState } from "@web/libs/store";
import {
  IDetailUser,
  IRole,
  IUser,
  STATUS_LABEL,
  STATUS_TAG,
  StatusOptions,
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
    title: NAV_TITLE.MANAGER_LIST,
  },
];

const columnsTitles: TableColumn<IUser>[] = [
  {
    title: "STT",
    dataIndex: "index",
  },
  {
    title: "Mã nhân viên",
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
    title: "Vai trò",
    dataIndex: "role",
    render: (role: IRole) => (
      <Tag color={ROLE_TAG[role.roleName]}>{ROLE_LABEL[role.roleName]}</Tag>
    ),
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

// Define Zod schema for manager form validation
const managerFormSchema = z
  .object({
    firstName: z.string().min(1, "Họ là bắt buộc"),
    lastName: z.string().min(1, "Tên là bắt buộc"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z
      .string()
      .min(8, "Mật khẩu xác nhận phải có ít nhất 8 ký tự"),
    phoneNumber: z.string().optional(),
    roleName: z.nativeEnum(RoleName, { required_error: "Vai trò là bắt buộc" }),
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]).optional(),
    departmentId: z.string().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

// Define type from schema
type ManagerFormValues = z.infer<typeof managerFormSchema>;

const ManagerActions = ({
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

const ManagerList = () => {
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

  // Manager form with validation
  const managerForm = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      roleName: RoleName.MANAGE,
      status: UserStatus.ACTIVE,
      departmentId: "",
    },
  });

  // Use debounced select hook for departments
  const { selectProps: departmentSelectProps } = useDebouncedSelect({
    control: managerForm.control,
    name: "departmentId",
    useGetDataQuery: useGetDepartmentsQuery,
    labelField: "name",
  });

  const { data, isFetching, refetch } = useGetManagersQuery(searchParams);
  const [createManager, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteManager, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] =
    useUpdateUserStatusMutation();

  const { current, pageSize } = pagination;

  const handleViewManager = (id: string) => {
    router.push(NAV_LINK.USER_DETAIL_OVERVIEW(id));
  };

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          render: (record: IUser) => {
            return (
              <ManagerActions
                record={record}
                onEdit={handleEditManager}
                onDelete={handleDeleteManager}
                onView={handleViewManager}
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
                onClick={() => handleViewManager(record.id)}
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

  const handleEditManager = (id: string) => {
    router.push(NAV_LINK.USER_DETAIL_SETTINGS(id));
  };

  const handleDeleteManager = (id: string) => {
    Modal.confirm({
      title: "Xóa nhân viên",
      content: "Bạn có chắc chắn muốn xóa nhân viên này?",
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await deleteManager(id).unwrap();
          toast.success("Nhân viên đã được xóa thành công");
          refetch();
        } catch (error) {
          // Handled by the apiErrorMiddleware
        }
      },
    });
  };

  const handleLockUser = (id: string) => {
    Modal.confirm({
      title: "Khóa nhân viên",
      content: "Bạn có chắc chắn muốn khóa nhân viên này?",
      onOk: async () => {
        try {
          await updateUserStatus({ id, status: UserStatus.BLOCKED }).unwrap();
          toast.success("Nhân viên đã được khóa thành công");
          refetch();
        } catch (error) {
          toast.error("Không thể khóa nhân viên");
        }
      },
    });
  };

  const handleUnlockUser = (id: string) => {
    Modal.confirm({
      title: "Mở khóa nhân viên",
      content: "Bạn có chắc chắn muốn mở khóa nhân viên này?",
      onOk: async () => {
        try {
          await updateUserStatus({ id, status: UserStatus.ACTIVE }).unwrap();
          toast.success("Nhân viên đã được mở khóa thành công");
          refetch();
        } catch (error) {
          toast.error("Không thể mở khóa nhân viên");
        }
      },
    });
  };

  const onSubmitCreate = async (data: ManagerFormValues) => {
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

      // Submit FormData
      await createManager(formData).unwrap();
      toast.success("Nhân viên đã được tạo thành công");

      handleCloseDrawer();
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCloseDrawer = () => {
    dispatch(closeCreateModal());
    // Reset form to default values
    managerForm.reset({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      roleName: RoleName.MANAGE,
      status: UserStatus.ACTIVE,
      departmentId: "",
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
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MANAGER_LIST}>
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="search"
                size="large"
                placeholder="Tìm kiếm theo tên, email hoặc mã nhân viên"
              />
              <CustomSelect
                control={searchForm.control}
                name="roleName"
                size="large"
                placeholder="Lọc theo vai trò"
                options={ManagerRoleOptions}
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
                  onClick={handleReset}
                  icon={<ReloadOutlined />}
                />
                <CustomButton
                  type="primary"
                  title="Tìm kiếm"
                  size="large"
                  onClick={searchForm.handleSubmit(onSubmitSearch)}
                  icon={<SearchOutlined />}
                />
              </div>
              <CustomButton
                type="primary"
                title="Thêm người quản lý"
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
        <CustomDrawer
          title="Thêm người quản lý"
          open={isOpenCreateModal}
          onCancel={handleCloseDrawer}
          onSubmit={managerForm.handleSubmit(onSubmitCreate)}
          loading={isCreating}
        >
          <form className="flex flex-col gap-4">
            <CustomInput
              control={managerForm.control}
              name="firstName"
              label="Họ"
              size="large"
              placeholder="Nhập họ"
              required
            />
            <CustomInput
              control={managerForm.control}
              name="lastName"
              label="Tên"
              size="large"
              placeholder="Nhập tên"
              required
            />
            <CustomInput
              control={managerForm.control}
              name="email"
              label="Email"
              size="large"
              placeholder="Nhập email"
              required
              autoComplete="off"
            />
            <CustomInput
              control={managerForm.control}
              name="password"
              label="Mật khẩu"
              size="large"
              placeholder="Nhập mật khẩu"
              type="password"
              required
              autoComplete="new-password"
            />
            <CustomInput
              control={managerForm.control}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              size="large"
              placeholder="Xác nhận mật khẩu"
              type="password"
              required
              autoComplete="new-password"
            />
            <CustomInput
              control={managerForm.control}
              name="phoneNumber"
              label="Số điện thoại"
              size="large"
              placeholder="Nhập số điện thoại"
            />

            {/* Department selection */}
            <CustomSelect
              control={managerForm.control}
              name="departmentId"
              label="Phòng ban"
              size="large"
              placeholder="Chọn phòng ban"
              options={departmentSelectProps.options}
              onFocus={departmentSelectProps.onFocus}
              onPopupScroll={departmentSelectProps.onPopupScroll}
            />

            <CustomSelect
              control={managerForm.control}
              name="roleName"
              label="Vai trò"
              size="large"
              placeholder="Chọn vai trò"
              options={ManagerRoleOptions}
              required
            />
            <CustomSelect
              control={managerForm.control}
              name="status"
              label="Trạng thái"
              size="large"
              placeholder="Chọn trạng thái"
              options={StatusOptions}
              required
            />
          </form>
        </CustomDrawer>
      </div>
    </PageLayout>
  );
};

export default ManagerList;
