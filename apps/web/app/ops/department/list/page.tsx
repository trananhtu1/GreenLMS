"use client";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomDrawer from "@web/components/common/CustomDrawer";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomInput from "@web/components/common/CustomInput";
import CustomTextArea from "@web/components/common/CustomTextArea";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import { TableColumn } from "@web/libs/common";
import { CreateDepartmentDto, IDepartment } from "@web/libs/department";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentsQuery,
  useLazyGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
} from "@web/libs/features/departments/departmentApi";
import {
  closeCreateModal,
  openCreateModal,
} from "@web/libs/features/table/tableSlice";
import { NAV_TITLE } from "@web/libs/nav";
import { RootState } from "@web/libs/store";
import { Card, Modal, Table, TablePaginationConfig } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.MANAGE_DEPARTMENTS,
  },
];

const columnsTitles: TableColumn<IDepartment>[] = [
  {
    title: "STT",
    dataIndex: "index",
  },
  {
    title: "Mã phòng ban",
    dataIndex: "code",
  },
  {
    title: "Tên phòng ban",
    dataIndex: "name",
  },
  {
    title: "Mô tả",
    dataIndex: "description",
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
  },
  {
    title: "Ngày cập nhật",
    dataIndex: "updatedAt",
    render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
  },
  {
    title: "",
    dataIndex: "method",
    fixed: "right",
  },
];

// Define Zod schema for department form validation
const departmentFormSchema = z.object({
  name: z.string().min(1, "Tên phòng ban là bắt buộc"),
  description: z.string().optional(),
});

// Create type from Zod schema
type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

// Add search form schema
const searchFormSchema = z.object({
  search: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const DepartmentActions = ({
  record,
  onEdit,
  onDelete,
}: {
  record: IDepartment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <CustomDropdown>
      <CustomButton
        type="link"
        title="Cập nhật"
        icon={<EditOutlined />}
        onClick={() => onEdit(record.id)}
      />
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

const Departments = () => {
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    defaultCurrent: 1,
    defaultPageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
  });
  const [searchParams, setSearchParams] = useState<{
    search?: string;
    page?: number;
    limit?: number;
  }>({
    page: 1,
    limit: 10,
  });
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { isOpenCreateModal } = useSelector((state: RootState) => state.table);
  const dispatch = useDispatch();

  // Search form
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  // Department form with validation
  const departmentForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { data, isFetching, refetch } = useGetDepartmentsQuery(searchParams);
  const [createDepartment, { isLoading: isCreating }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] =
    useUpdateDepartmentMutation();
  const [deleteDepartment, { isLoading: isDeleting }] =
    useDeleteDepartmentMutation();
  const [getDepartmentById, { isFetching: isLoadingDepartment }] =
    useLazyGetDepartmentByIdQuery();

  const { current, pageSize } = pagination;

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          render: (record: IDepartment) => {
            return (
              <DepartmentActions
                record={record}
                onEdit={handleEditDepartment}
                onDelete={handleDeleteDepartment}
              />
            );
          },
          key: index,
        };
      }
      if (item.dataIndex === "name") {
        return {
          ...item,
          render: (name: string, record: IDepartment) => (
            <CustomTooltip title={name}>
              <span
                className="cursor-pointer text-blue-500 hover:text-blue-700"
                onClick={() => handleEditDepartment(record.id)}
              >
                {name}
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

  const onSubmitSearch = (formData: { search?: string }) => {
    setSearchParams({
      ...searchParams,
      search: formData.search,
      page: 1,
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

  const handleEditDepartment = (id: string) => {
    setSelectedDepartmentId(id);
    setIsEditMode(true);

    getDepartmentById(id)
      .unwrap()
      .then((response) => {
        if (response?.data) {
          const department = response.data;
          departmentForm.reset({
            name: department.name,
            description: department.description,
          });
          dispatch(openCreateModal());
        }
      })
      .catch((error) => {
        // Error handling
      });
  };

  const handleDeleteDepartment = (id: string) => {
    Modal.confirm({
      title: "Xóa phòng ban",
      content: "Bạn có chắc chắn muốn xóa phòng ban này?",
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await deleteDepartment(id).unwrap();
          toast.success("Phòng ban đã được xóa thành công");
          refetch();
        } catch (error) {
          // Handled by the apiErrorMiddleware
        }
      },
    });
  };

  const onSubmitDepartment = async (formData: DepartmentFormValues) => {
    try {
      const departmentData: CreateDepartmentDto = {
        name: formData.name,
        description: formData.description,
      };

      if (isEditMode && selectedDepartmentId) {
        await updateDepartment({
          id: selectedDepartmentId,
          data: departmentData,
        }).unwrap();
        toast.success("Phòng ban đã được cập nhật thành công");
      } else {
        await createDepartment(departmentData).unwrap();
        toast.success("Phòng ban đã được tạo thành công");
      }
      handleCloseDrawer();
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCloseDrawer = () => {
    dispatch(closeCreateModal());
    departmentForm.reset();
    setIsEditMode(false);
    setSelectedDepartmentId(null);
  };

  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
    setSearchParams({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleAddDepartment = () => {
    setIsEditMode(false);
    departmentForm.reset({
      name: "",
      description: "",
    });
    dispatch(openCreateModal());
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MANAGE_DEPARTMENTS}>
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="search"
                size="large"
                placeholder="Tìm kiếm theo tên hoặc mã phòng ban"
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
                title="Thêm phòng ban"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleAddDepartment}
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
        title={isEditMode ? "Cập nhật phòng ban" : "Thêm phòng ban"}
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={departmentForm.handleSubmit(onSubmitDepartment)}
        loading={isCreating || isUpdating || isLoadingDepartment}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={departmentForm.control}
            name="name"
            label="Tên phòng ban"
            placeholder="Nhập tên phòng ban"
            required
          />

          <CustomTextArea
            control={departmentForm.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả phòng ban"
          />
        </div>
      </CustomDrawer>
    </PageLayout>
  );
};

export default Departments;
