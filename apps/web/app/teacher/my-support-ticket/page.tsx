"use client";
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
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
import {
  DATE_TIME_FORMAT,
  TableColumn,
  calculateApprovalDeadline,
  isPastApprovalDeadline,
} from "@web/libs/common";
import { useGetClassesQuery } from "@web/libs/features/classes/classApi";
import {
  useCreateSupportTicketMutation,
  useDeleteSupportTicketMutation,
  useGetSupportTicketsQuery,
  useLazyGetSupportTicketByIdQuery,
  useUpdateSupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
} from "@web/libs/features/requests/requestApi";
import {
  closeCancelModal,
  closeCreateModal,
  closeDeleteModal,
  closeDetailModal,
  openCancelModal,
  openCreateModal,
  openDeleteModal,
  openDetailModal,
  setEditMode,
  setSelectedItemId,
} from "@web/libs/features/table/tableSlice";
import { NAV_TITLE } from "@web/libs/nav";
import {
  IRequest,
  ISupportTicket,
  REQUEST_PRIORITY_TAG,
  REQUEST_STATUS_TAG,
  RequestAction,
  RequestPriority,
  RequestPriorityOptions,
  RequestStatus,
  RequestStatusOptions,
  RequestType,
} from "@web/libs/request";
import { RootState } from "@web/libs/store";
import { IUser } from "@web/libs/user";
import {
  Card,
  Divider,
  Modal,
  Spin,
  Table,
  TablePaginationConfig,
  Tag,
  Typography,
} from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.MY_SUPPORT_TICKET,
  },
];

const columnsTitles: TableColumn<IRequest>[] = [
  {
    title: "STT",
    dataIndex: "index",
  },
  {
    title: "Tên yêu cầu",
    dataIndex: "name",
  },
  {
    title: "Mô tả",
    dataIndex: "description",
  },
  {
    title: "Lớp",
    dataIndex: "supportTicket",
    render: (supportTicket: ISupportTicket) => supportTicket.class?.name,
  },
  {
    title: "Mức độ ưu tiên",
    dataIndex: "supportTicket",
    render: (supportTicket: ISupportTicket) => (
      <Tag color={REQUEST_PRIORITY_TAG[supportTicket.priority]}>
        {supportTicket.priority}
      </Tag>
    ),
  },
  {
    title: "Người phê duyệt",
    dataIndex: "approver",
    render: (approver: IUser) => approver?.fullName,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: (status: RequestStatus) => (
      <Tag color={REQUEST_STATUS_TAG[status]}>{status}</Tag>
    ),
  },
  {
    title: "Ngày hạn phê duyệt",
    dataIndex: "createdAt",
    render: (date: string) => {
      const isOverdue = isPastApprovalDeadline(date);
      return (
        <span className={isOverdue ? "font-medium text-red-500" : ""}>
          {calculateApprovalDeadline(date)}
        </span>
      );
    },
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    render: (date: string) => dayjs(date).format(DATE_TIME_FORMAT),
  },
  {
    title: "",
    dataIndex: "method",
    fixed: "right",
  },
];

const supportTicketSchema = z.object({
  name: z.string().min(1, "Tên yêu cầu là bắt buộc"),
  description: z.string().optional(),
  classId: z.string().min(1, "ID lớp là bắt buộc"),
  priority: z.nativeEnum(RequestPriority, {
    errorMap: () => ({ message: "Mức độ ưu tiên là bắt buộc" }),
  }),
});

type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

const SupportTicketActions = ({
  record,
  onOpenDetail,
  onStartEdit,
  onOpenCancelModal,
  onOpenDeleteModal,
}: {
  record: IRequest;
  onOpenDetail: (id: string) => void;
  onStartEdit: (id: string) => void;
  onOpenCancelModal: (id: string) => void;
  onOpenDeleteModal: (id: string) => void;
}) => {
  // Check if the request is past due for approval
  const isPastDue = isPastApprovalDeadline(record.createdAt);

  // If it's past due, only allow viewing regardless of status
  if (isPastDue) {
    return (
      <CustomDropdown>
        <CustomButton
          type="link"
          title="Xem"
          icon={<EyeOutlined />}
          onClick={() => onOpenDetail(record.id)}
        />
      </CustomDropdown>
    );
  }

  return (
    <CustomDropdown>
      <CustomButton
        type="link"
        title="Xem"
        icon={<EyeOutlined />}
        onClick={() => onOpenDetail(record.id)}
      />
      {record.status === RequestStatus.PENDING && (
        <CustomButton
          type="link"
          title="Cập nhật"
          icon={<EditOutlined />}
          onClick={() => onStartEdit(record.id)}
        />
      )}
      {record.status === RequestStatus.PENDING && (
        <CustomButton
          type="link"
          title="Xóa"
          color="danger"
          icon={<DeleteOutlined />}
          onClick={() => onOpenDeleteModal(record.id)}
        />
      )}
      {record.status === RequestStatus.APPROVED && (
        <CustomButton
          type="link"
          title="Hủy bỏ"
          color="danger"
          icon={<StopOutlined />}
          onClick={() => onOpenCancelModal(record.id)}
        />
      )}
    </CustomDropdown>
  );
};

// Add search form schema
const searchFormSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const MySupportTicket = () => {
  const [searchParams, setSearchParams] = useState<{
    name?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }>({
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    defaultCurrent: 1,
    defaultPageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });

  const dispatch = useDispatch();
  const {
    isOpenCreateModal,
    isDetailModalOpen,
    isCancelModalOpen,
    isDeleteModalOpen,
    isEditMode,
    selectedItemId,
  } = useSelector((state: RootState) => state.table);

  const {
    data: supportTicketsData,
    isFetching,
    refetch,
  } = useGetSupportTicketsQuery(searchParams);

  const [fetchSupportTicketDetail, { data: supportTicketDetail }] =
    useLazyGetSupportTicketByIdQuery();

  const [createSupportTicket, { isLoading: isCreating }] =
    useCreateSupportTicketMutation();
  const [updateSupportTicket, { isLoading: isUpdating }] =
    useUpdateSupportTicketMutation();
  const [updateSupportTicketStatus, { isLoading: isCanceling }] =
    useUpdateSupportTicketStatusMutation();

  const [deleteSupportTicket, { isLoading: isDeleting }] =
    useDeleteSupportTicketMutation();

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  const classOptions = useMemo(() => {
    return (
      supportTicketsData?.data?.items.map((item) => ({
        label: item.supportTicket.class.name,
        value: item.supportTicket.class.id,
      })) || []
    );
  }, [supportTicketsData]);

  // Add debounced select for class selection
  const { selectProps: classSelectProps } = useDebouncedSelect({
    control: searchForm.control,
    name: "classId",
    useGetDataQuery: useGetClassesQuery,
    labelField: "name",
    initialOptions: classOptions,
  });

  // Use zod validation for the support ticket form
  const supportTicketForm = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      name: "",
      description: "",
      classId: undefined,
      priority: RequestPriority.MEDIUM,
    },
  });

  // Change from direct map to useMemo with name field rendering
  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          key: index,
          render: (record: IRequest) => (
            <SupportTicketActions
              record={record}
              onOpenDetail={handleOpenDetail}
              onStartEdit={handleStartEdit}
              onOpenCancelModal={handleOpenCancelModal}
              onOpenDeleteModal={handleOpenDeleteModal}
            />
          ),
        };
      }
      if (item.dataIndex === "name") {
        return {
          ...item,
          key: index,
          render: (name: string, record: IRequest) => (
            <CustomTooltip title={name}>
              <span
                className="cursor-pointer text-blue-500 hover:text-blue-700"
                onClick={() => handleOpenDetail(record.id)}
              >
                {name}
              </span>
            </CustomTooltip>
          ),
        };
      }
      return {
        ...item,
        key: index,
      };
    });
  }, []);

  const { current, pageSize } = pagination;

  const tableData = useMemo(() => {
    return (
      supportTicketsData?.data?.items.map((item, index) => ({
        ...item,
        index: ((current || 1) - 1) * (pageSize || 10) + index + 1,
        method: item,
      })) || []
    );
  }, [supportTicketsData, current, pageSize]);

  useEffect(() => {
    if (supportTicketsData?.data) {
      setPagination((prev) => ({
        ...prev,
        current: supportTicketsData.data.page || prev.current,
        pageSize: supportTicketsData.data.limit || prev.pageSize,
        total: supportTicketsData.data.total || 0,
      }));
    }
  }, [supportTicketsData]);

  const handleStartEdit = async (id: string) => {
    dispatch(setSelectedItemId(id));
    dispatch(setEditMode(true));
    dispatch(closeDetailModal());

    try {
      const response = await fetchSupportTicketDetail(id).unwrap();
      if (response?.data) {
        supportTicketForm.setValue("name", response.data.name);
        supportTicketForm.setValue(
          "description",
          response.data.description || "",
        );
        supportTicketForm.setValue(
          "classId",
          response.data.supportTicket.class?.id,
        );
        supportTicketForm.setValue(
          "priority",
          response.data.supportTicket.priority,
        );
      }
      dispatch(openCreateModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const onSubmitSearch = (data: {
    name?: string;
    status?: string;
    priority?: string;
  }) => {
    setSearchParams({
      ...searchParams,
      ...data,
      page: 1,
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

  const handleOpenDetail = (id: string) => {
    dispatch(openDetailModal(id));
    fetchSupportTicketDetail(id);
  };

  const handleCloseDetail = () => {
    dispatch(closeDetailModal());
  };

  const handleOpenCancelModal = (id: string) => {
    dispatch(openCancelModal(id));
  };

  const handleOpenDeleteModal = (id: string) => {
    dispatch(openDeleteModal(id));
  };

  const handleDelete = async () => {
    if (!selectedItemId) return;

    try {
      await deleteSupportTicket(selectedItemId).unwrap();
      toast.success("Yêu cầu hỗ trợ đã được xóa thành công");
      refetch();
      dispatch(closeDeleteModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const onSubmitCreate = async (data: SupportTicketFormValues) => {
    const formattedData = {
      name: data.name,
      description: data.description || "",
      classId: data.classId,
      priority: data.priority,
      type: RequestType.SUPPORT_TICKET,
    };

    try {
      if (isEditMode && supportTicketDetail?.data) {
        const res = await updateSupportTicket({
          id: supportTicketDetail.data.id,
          data: formattedData,
        }).unwrap();
        toast.success(res.message);
      } else {
        const res = await createSupportTicket(formattedData).unwrap();
        toast.success(res.message);
      }
      refetch();
      handleCloseDrawer();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCloseDrawer = () => {
    dispatch(closeCreateModal());
    supportTicketForm.reset();
    dispatch(setEditMode(false));
    dispatch(setSelectedItemId(null));
  };

  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setSearchParams({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleCancel = async () => {
    if (!selectedItemId) return;

    try {
      await updateSupportTicketStatus({
        id: selectedItemId,
        action: RequestAction.CANCEL,
      }).unwrap();
      toast.success("Yêu cầu hỗ trợ đã được hủy bỏ thành công");
      refetch();
      dispatch(closeCancelModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MY_SUPPORT_TICKET}>
      <div id="support-ticket-container" className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="name"
                size="large"
                placeholder="Tìm kiếm theo tên yêu cầu"
              />
              <CustomSelect
                control={searchForm.control}
                name="status"
                size="large"
                placeholder="Lọc theo trạng thái"
                options={RequestStatusOptions}
              />
              <CustomSelect
                control={searchForm.control}
                name="priority"
                size="large"
                placeholder="Lọc theo mức độ ưu tiên"
                options={RequestPriorityOptions}
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
                title="Tạo yêu cầu hỗ trợ"
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
      {/* Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu hỗ trợ"
        open={isDetailModalOpen}
        onCancel={handleCloseDetail}
        footer={[
          <CustomButton
            key="close"
            title="Đóng"
            icon={<CloseOutlined />}
            onClick={handleCloseDetail}
          />,
          !isPastApprovalDeadline(supportTicketDetail?.data?.createdAt) && (
            <CustomButton
              key="edit"
              type="primary"
              title="Cập nhật"
              icon={<EditOutlined />}
              onClick={() => handleStartEdit(supportTicketDetail.data.id)}
            />
          ),
        ]}
        width={800}
      >
        {supportTicketDetail ? (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.Text type="secondary">Tên yêu cầu:</Typography.Text>
              <Typography.Title level={5} className="mt-1">
                {supportTicketDetail.data.name}
              </Typography.Title>
            </div>

            <div>
              <Typography.Text type="secondary">Mô tả:</Typography.Text>
              <Typography.Paragraph className="mt-1">
                {supportTicketDetail.data.description || ""}
              </Typography.Paragraph>
            </div>

            <div className="flex gap-4">
              <div>
                <Typography.Text type="secondary">Trạng thái:</Typography.Text>
                <span className="ml-2">
                  <Tag
                    color={REQUEST_STATUS_TAG[supportTicketDetail.data.status]}
                  >
                    {supportTicketDetail.data.status}
                  </Tag>
                </span>
              </div>
              <div>
                <Typography.Text type="secondary">
                  Mức độ ưu tiên:
                </Typography.Text>
                <span className="ml-2">
                  <Tag
                    color={
                      REQUEST_PRIORITY_TAG[
                        supportTicketDetail.data.supportTicket.priority
                      ]
                    }
                  >
                    {supportTicketDetail.data.supportTicket.priority}
                  </Tag>
                </span>
              </div>
            </div>

            <Divider orientation="left">Chi tiết yêu cầu hỗ trợ</Divider>

            <Card size="small" className="mb-4">
              <div className="flex flex-col gap-2">
                <div>
                  <Typography.Text type="secondary">Lớp</Typography.Text>
                  <Typography.Text className="ml-2">
                    {supportTicketDetail.data.supportTicket?.class?.name}
                  </Typography.Text>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <div>
                <Typography.Text type="secondary">Ngày tạo:</Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(supportTicketDetail.data.createdAt).format(
                    DATE_TIME_FORMAT,
                  )}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text type="secondary">
                  Ngày cập nhật:
                </Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(supportTicketDetail.data.updatedAt).format(
                    DATE_TIME_FORMAT,
                  )}
                </Typography.Text>
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Ngày hạn phê duyệt:
              </Typography.Text>
              <Typography.Text
                className={`ml-2 ${isPastApprovalDeadline(supportTicketDetail.data.createdAt) ? "font-medium text-red-500" : ""}`}
              >
                {calculateApprovalDeadline(supportTicketDetail.data.createdAt)}
                {isPastApprovalDeadline(supportTicketDetail.data.createdAt) && (
                  <span className="ml-2">(Quá hạn)</span>
                )}
              </Typography.Text>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-10">
            <Spin size="large" />
          </div>
        )}
      </Modal>
      {/* Create/Edit Drawer */}
      <CustomDrawer
        title={isEditMode ? "Cập nhật yêu cầu hỗ trợ" : "Tạo yêu cầu hỗ trợ"}
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={supportTicketForm.handleSubmit(onSubmitCreate)}
        loading={isCreating || isUpdating}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={supportTicketForm.control}
            name="name"
            label="Tên yêu cầu"
            placeholder="Nhập tên yêu cầu"
            size="large"
            required
          />

          <CustomInput
            control={supportTicketForm.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả (tùy chọn)"
            size="large"
          />

          <Divider orientation="left">Chi tiết yêu cầu hỗ trợ</Divider>

          {/* Replace the class ID input with debounced select */}
          <CustomSelect
            control={supportTicketForm.control}
            name="classId"
            label="Lớp"
            placeholder="Tìm kiếm và chọn lớp"
            size="large"
            options={classSelectProps.options}
            onFocus={classSelectProps.onFocus}
            onPopupScroll={classSelectProps.onPopupScroll}
            required
          />

          <CustomSelect
            control={supportTicketForm.control}
            name="priority"
            label="Mức độ ưu tiên"
            placeholder="Chọn mức độ ưu tiên"
            size="large"
            options={RequestPriorityOptions}
            required
          />
        </div>
      </CustomDrawer>
      {/* Cancel Confirmation Modal */}
      <Modal
        title="Hủy bỏ yêu cầu hỗ trợ"
        open={isCancelModalOpen}
        onCancel={() => dispatch(closeCancelModal())}
        footer={[
          <CustomButton
            key="back"
            title="Không, giữ nguyên"
            onClick={() => dispatch(closeCancelModal())}
          />,
          <CustomButton
            key="submit"
            type="primary"
            color="danger"
            title="Có, hủy bỏ"
            loading={isCanceling}
            onClick={handleCancel}
          />,
        ]}
      >
        <Typography.Paragraph>
          Bạn có chắc chắn muốn hủy bỏ yêu cầu hỗ trợ này không? Hành động này
          không thể hoàn tác.
        </Typography.Paragraph>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa yêu cầu hỗ trợ"
        open={isDeleteModalOpen}
        onCancel={() => dispatch(closeDeleteModal())}
        footer={[
          <CustomButton
            key="back"
            title="Hủy bỏ"
            onClick={() => dispatch(closeDeleteModal())}
          />,
          <CustomButton
            key="submit"
            type="primary"
            color="danger"
            title="Xóa"
            loading={isDeleting}
            onClick={handleDelete}
          />,
        ]}
      >
        <Typography.Paragraph>
          Bạn có chắc chắn muốn xóa yêu cầu hỗ trợ này không? Hành động này
          không thể hoàn tác.
        </Typography.Paragraph>
      </Modal>
    </PageLayout>
  );
};

export default MySupportTicket;
