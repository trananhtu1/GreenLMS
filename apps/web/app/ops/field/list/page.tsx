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
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTextArea from "@web/components/common/CustomTextArea";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import { useDebouncedSelect } from "@web/hooks/useDebouncedSelect";
import PageLayout from "@web/layouts/PageLayout";
import { TableColumn } from "@web/libs/common";
import {
  useCreateFieldMutation,
  useDeleteFieldMutation,
  useGetFieldsQuery,
  useLazyGetFieldByIdQuery,
  useUpdateFieldMutation,
} from "@web/libs/features/fields/fieldApi";
import {
  closeCreateModal,
  openCreateModal,
} from "@web/libs/features/table/tableSlice";
import { useGetManagersQuery } from "@web/libs/features/users/userApi";
import { CreateFieldDto, IField } from "@web/libs/field";
import { NAV_TITLE } from "@web/libs/nav";
import { RootState } from "@web/libs/store";
import { IUser } from "@web/libs/user";
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
    title: NAV_TITLE.MANAGE_FIELDS,
  },
];

const columnsTitles: TableColumn<IField>[] = [
  {
    title: "STT",
    dataIndex: "index",
  },
  {
    title: "Mã chứng chỉ",
    dataIndex: "code",
  },
  {
    title: "Tên chứng chỉ",
    dataIndex: "name",
  },
  {
    title: "Mô tả",
    dataIndex: "description",
  },
  // {
  //   title: "Trưởng bộ môn",
  //   dataIndex: "leader",
  //   render: (leader: IUser | null) => leader?.fullName,
  // },
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

// Define Zod schema for field form validation
const fieldFormSchema = z.object({
  name: z.string().min(1, "Tên chứng chỉ là bắt buộc"),
  description: z.string().optional(),
  leaderId: z.string().optional().nullable(),
});

// Create type from Zod schema
type FieldFormValues = z.infer<typeof fieldFormSchema>;

// Add search form schema
const searchFormSchema = z.object({
  search: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const FieldActions = ({
  record,
  onEdit,
  onDelete,
}: {
  record: IField;
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

const Fields = () => {
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
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { isOpenCreateModal } = useSelector((state: RootState) => state.table);
  const dispatch = useDispatch();

  // Search form
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  // Field form with validation
  const fieldForm = useForm<FieldFormValues>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: "",
      description: "",
      leaderId: null,
    },
  });

  // Add the useDebouncedSelect hook for managers
  const { selectProps: leaderSelectProps } = useDebouncedSelect({
    control: fieldForm.control,
    name: "leaderId",
    useGetDataQuery: useGetManagersQuery,
    labelField: "fullName",
    valueField: "id",
    queryArgs: { roleName: "manager" },
  });

  const { data, isFetching, refetch } = useGetFieldsQuery(searchParams);
  const [createField, { isLoading: isCreating }] = useCreateFieldMutation();
  const [updateField, { isLoading: isUpdating }] = useUpdateFieldMutation();
  const [deleteField, { isLoading: isDeleting }] = useDeleteFieldMutation();
  const [getFieldById, { isFetching: isLoadingField }] =
    useLazyGetFieldByIdQuery();

  const { current, pageSize } = pagination;

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          render: (_, record: IField) => {
            return (
              <FieldActions
                record={record}
                onEdit={handleEditField}
                onDelete={handleDeleteField}
              />
            );
          },
          key: index,
        };
      }
      if (item.dataIndex === "name") {
        return {
          ...item,
          render: (name: string, record: IField) => (
            <CustomTooltip title={name}>
              <span
                className="cursor-pointer text-blue-500 hover:text-blue-700"
                onClick={() => handleEditField(record.id)}
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

  const handleEditField = (id: string) => {
    setSelectedFieldId(id);
    setIsEditMode(true);

    getFieldById(id)
      .unwrap()
      .then((response) => {
        if (response?.data) {
          const field = response.data;
          fieldForm.reset({
            name: field.name,
            description: field.description,
            leaderId: field.leaderId,
          });
          dispatch(openCreateModal());
        }
      })
      .catch((error) => {
        // Error handling
      });
  };

  const handleDeleteField = (id: string) => {
    Modal.confirm({
      title: "Xóa chứng chỉ",
      content: "Bạn có chắc chắn muốn xóa chứng chỉ này?",
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await deleteField(id).unwrap();
          toast.success("chứng chỉ đã được xóa thành công");
          refetch();
        } catch (error) {
          // Handled by the apiErrorMiddleware
        }
      },
    });
  };

  const onSubmitField = async (formData: FieldFormValues) => {
    try {
      const fieldData: CreateFieldDto = {
        name: formData.name,
        description: formData.description,
        leaderId: formData.leaderId || undefined,
      };

      if (isEditMode && selectedFieldId) {
        await updateField({ id: selectedFieldId, data: fieldData }).unwrap();
        toast.success("chứng chỉ đã được cập nhật thành công");
      } else {
        await createField(fieldData).unwrap();
        toast.success("chứng chỉ đã được tạo thành công");
      }
      handleCloseDrawer();
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCloseDrawer = () => {
    dispatch(closeCreateModal());
    fieldForm.reset();
    setIsEditMode(false);
    setSelectedFieldId(null);
  };

  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
    setSearchParams({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleAddField = () => {
    setIsEditMode(false);
    fieldForm.reset({
      name: "",
      description: "",
      leaderId: null,
    });
    dispatch(openCreateModal());
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MANAGE_FIELDS}>
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="search"
                size="large"
                placeholder="Tìm kiếm theo tên hoặc mã chứng chỉ"
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
                title="Thêm chứng chỉ"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleAddField}
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
        title={isEditMode ? "Cập nhật chứng chỉ" : "Thêm chứng chỉ"}
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={fieldForm.handleSubmit(onSubmitField)}
        loading={isCreating || isUpdating || isLoadingField}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={fieldForm.control}
            name="name"
            label="Tên chứng chỉ"
            placeholder="Nhập tên chứng chỉ"
            required
          />

          <CustomTextArea
            control={fieldForm.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả chứng chỉ"
          />

          <CustomSelect
            control={fieldForm.control}
            name="leaderId"
            label="Trưởng bộ môn"
            placeholder="Chọn trưởng bộ môn"
            options={leaderSelectProps.options}
            onFocus={leaderSelectProps.onFocus}
            onPopupScroll={leaderSelectProps.onPopupScroll}
            loading={leaderSelectProps.loading}
            showSearch
          />
        </div>
      </CustomDrawer>
    </PageLayout>
  );
};

export default Fields;
