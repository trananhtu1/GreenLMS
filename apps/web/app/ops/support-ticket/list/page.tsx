"use client";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import {
  DATE_TIME_FORMAT,
  TableColumn,
  calculateApprovalDeadline,
  isPastApprovalDeadline,
} from "@web/libs/common";
import {
  useGetSupportTicketsQuery,
  useLazyGetSupportTicketByIdQuery,
  useUpdateSupportTicketStatusMutation,
} from "@web/libs/features/requests/requestApi";
import {
  closeApproveModal,
  closeCancelModal,
  closeDetailModal,
  closeRejectModal,
  openApproveModal,
  openCancelModal,
  openDetailModal,
  openRejectModal,
} from "@web/libs/features/table/tableSlice";
import { NAV_TITLE } from "@web/libs/nav";
import {
  IRequest,
  ISupportTicket,
  REQUEST_PRIORITY_TAG,
  REQUEST_STATUS_TAG,
  RequestAction,
  RequestPriorityOptions,
  RequestStatus,
  RequestStatusOptions,
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
    title: NAV_TITLE.MANAGE_SUPPORT_TICKETS,
  },
];

const columnsTitles: TableColumn<IRequest>[] = [
  { title: "STT", dataIndex: "index" },
  { title: "Tên phiếu", dataIndex: "name" },
  { title: "Mô tả", dataIndex: "description" },
  {
    title: "Lớp",
    dataIndex: "supportTicket",
    render: (supportTicket: ISupportTicket) => supportTicket?.class?.name,
  },
  {
    title: "Người tạo",
    dataIndex: "creator",
    render: (creator: IUser) => creator?.fullName,
  },
  {
    title: "Người phê duyệt",
    dataIndex: "approver",
    render: (approver: IUser) => approver?.fullName,
  },
  {
    title: "Mức độ ưu tiên",
    dataIndex: "supportTicket",
    render: (supportTicket: ISupportTicket) => (
      <Tag color={REQUEST_PRIORITY_TAG[supportTicket?.priority]}>
        {supportTicket?.priority}
      </Tag>
    ),
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
  { title: "", dataIndex: "method", fixed: "right" },
];

const SupportTicketActions = ({
  record,
  onOpenDetail,
  onOpenApproveModal,
  onOpenCancelModal,
  onOpenRejectModal,
}: {
  record: IRequest;
  onOpenDetail: (id: string) => void;
  onOpenApproveModal: (id: string) => void;
  onOpenCancelModal: (id: string) => void;
  onOpenRejectModal: (id: string) => void;
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
          title="Phê duyệt"
          icon={<CheckOutlined />}
          onClick={() => onOpenApproveModal(record.id)}
        />
      )}
      {record.status === RequestStatus.PENDING && (
        <CustomButton
          type="link"
          title="Từ chối"
          color="danger"
          icon={<CloseOutlined />}
          onClick={() => onOpenRejectModal(record.id)}
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

const SupportTicketList = () => {
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
    isDetailModalOpen,
    isCancelModalOpen,
    isApproveModalOpen,
    isRejectModalOpen,
    selectedItemId,
  } = useSelector((state: RootState) => state.table);

  const {
    data: supportTicketsData,
    isFetching,
    refetch,
  } = useGetSupportTicketsQuery(searchParams);

  const [fetchSupportTicketDetail, { data: supportTicketDetail }] =
    useLazyGetSupportTicketByIdQuery();

  const [updateSupportTicketStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSupportTicketStatusMutation();

  // Update the search form to use Zod
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  const tableColumns = columnsTitles.map((item, index) => {
    if (item.dataIndex === "method") {
      return {
        ...item,
        key: index,
        render: (record: IRequest) => (
          <SupportTicketActions
            record={record}
            onOpenDetail={handleOpenDetail}
            onOpenApproveModal={handleOpenApproveModal}
            onOpenCancelModal={handleOpenCancelModal}
            onOpenRejectModal={handleOpenRejectModal}
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

  // Update pagination when data changes
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

  // Update the handleReset function to include refetch
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

  const onSubmitSearch = (values: SearchFormValues) => {
    setSearchParams({
      ...searchParams,
      name: values.name,
      status: values.status,
      priority: values.priority,
      page: 1,
    });
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const handleOpenDetail = (id: string) => {
    dispatch(openDetailModal(id));
    fetchSupportTicketDetail(id);
  };

  const handleCloseDetail = () => {
    dispatch(closeDetailModal());
  };

  const handleOpenApproveModal = (id: string) => {
    dispatch(openApproveModal(id));
  };

  const handleOpenCancelModal = (id: string) => {
    dispatch(openCancelModal(id));
  };

  const handleOpenRejectModal = (id: string) => {
    dispatch(openRejectModal(id));
  };

  const handleApprove = async () => {
    if (!selectedItemId) return;

    try {
      await updateSupportTicketStatus({
        id: selectedItemId,
        action: RequestAction.APPROVE,
      }).unwrap();
      toast.success("Support ticket approved successfully");
      refetch();
      dispatch(closeApproveModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCancel = async () => {
    if (!selectedItemId) return;

    try {
      await updateSupportTicketStatus({
        id: selectedItemId,
        action: RequestAction.CANCEL,
      }).unwrap();
      toast.success("Support ticket canceled successfully");
      refetch();
      dispatch(closeCancelModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleReject = async () => {
    if (!selectedItemId) return;
    try {
      await updateSupportTicketStatus({
        id: selectedItemId,
        action: RequestAction.REJECT,
      }).unwrap();
      toast.success("Support ticket rejected successfully");
      refetch();
      dispatch(closeRejectModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setSearchParams({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      title={NAV_TITLE.MANAGE_SUPPORT_TICKETS}
    >
      <div id="support-tickets-container" className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="name"
                size="large"
                placeholder="Tìm kiếm theo tên phiếu"
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
        title="Chi tiết phiếu hỗ trợ"
        open={isDetailModalOpen}
        onCancel={handleCloseDetail}
        footer={[
          <CustomButton
            key="close"
            title="Đóng"
            icon={<CloseOutlined />}
            onClick={handleCloseDetail}
          />,
          supportTicketDetail?.data.status === RequestStatus.PENDING && (
            <CustomButton
              key="approve"
              type="primary"
              title="Phê duyệt"
              icon={<CheckOutlined />}
              onClick={() =>
                handleOpenApproveModal(supportTicketDetail.data.id)
              }
            />
          ),
          supportTicketDetail?.data.status === RequestStatus.PENDING && (
            <CustomButton
              key="reject"
              type="primary"
              color="danger"
              title="Từ chối"
              icon={<CloseOutlined />}
              onClick={() => handleOpenRejectModal(supportTicketDetail.data.id)}
            />
          ),
        ]}
        width={800}
      >
        {supportTicketDetail ? (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.Text type="secondary">Tên phiếu:</Typography.Text>
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

            <div>
              <Typography.Text type="secondary">Người tạo:</Typography.Text>
              <Typography.Text className="ml-2">
                {supportTicketDetail.data.creator?.fullName || "N/A"}
              </Typography.Text>
            </div>

            <div>
              <Typography.Text type="secondary">Người yêu cầu:</Typography.Text>
              <Typography.Text className="ml-2">
                {supportTicketDetail.data.requester?.fullName || "N/A"}
              </Typography.Text>
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

            <Divider orientation="left">Chi tiết phiếu hỗ trợ</Divider>

            <Card size="small" className="mb-4">
              <div className="flex flex-col gap-2">
                <div>
                  <Typography.Text type="secondary">Lớp:</Typography.Text>
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
                  <span className="ml-2">(Overdue)</span>
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

      {/* Approve Confirmation Modal */}
      <Modal
        title="Phê duyệt phiếu hỗ trợ"
        open={isApproveModalOpen}
        onCancel={() => dispatch(closeApproveModal())}
        footer={[
          <CustomButton
            key="back"
            title="Hủy bỏ"
            icon={<CloseOutlined />}
            onClick={() => dispatch(closeApproveModal())}
          />,
          <CustomButton
            key="submit"
            type="primary"
            title="Phê duyệt"
            icon={<CheckOutlined />}
            loading={isUpdatingStatus}
            onClick={handleApprove}
          />,
        ]}
      >
        <Typography.Paragraph>
          Bạn có chắc chắn muốn phê duyệt phiếu hỗ trợ này không?
        </Typography.Paragraph>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        title="Hủy bỏ phiếu hỗ trợ"
        open={isCancelModalOpen}
        onCancel={() => dispatch(closeCancelModal())}
        footer={[
          <CustomButton
            key="back"
            title="Không, giữ nguyên"
            icon={<CloseOutlined />}
            onClick={() => dispatch(closeCancelModal())}
          />,
          <CustomButton
            key="submit"
            type="primary"
            color="danger"
            title="Có, hủy bỏ"
            icon={<StopOutlined />}
            loading={isUpdatingStatus}
            onClick={handleCancel}
          />,
        ]}
      >
        <Typography.Paragraph>
          Bạn có chắc chắn muốn hủy bỏ phiếu hỗ trợ này không? Hành động này
          không thể hoàn tác.
        </Typography.Paragraph>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        title="Từ chối phiếu hỗ trợ"
        open={isRejectModalOpen}
        onCancel={() => dispatch(closeRejectModal())}
        footer={[
          <CustomButton
            key="back"
            title="Hủy bỏ"
            icon={<CloseOutlined />}
            onClick={() => dispatch(closeRejectModal())}
          />,
          <CustomButton
            key="submit"
            type="primary"
            color="danger"
            title="Từ chối"
            icon={<CloseOutlined />}
            loading={isUpdatingStatus}
            onClick={handleReject}
          />,
        ]}
      >
        <Typography.Paragraph>
          Bạn có chắc chắn muốn từ chối phiếu hỗ trợ này không?
        </Typography.Paragraph>
      </Modal>
    </PageLayout>
  );
};

export default SupportTicketList;
