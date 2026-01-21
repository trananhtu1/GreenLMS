"use client";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
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
  useGetBusySchedulesQuery,
  useLazyGetBusyScheduleByIdQuery,
  useUpdateBusyScheduleStatusMutation,
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
import { NAV_LINK, NAV_TITLE } from "@web/libs/nav";
import {
  IRequest,
  REQUEST_STATUS_TAG,
  RequestAction,
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
    href: NAV_LINK.MANAGE_REQUESTS,
    title: NAV_TITLE.MANAGE_REQUESTS,
  },
  {
    title: NAV_TITLE.BUSY_SCHEDULE_LIST,
  },
];

const searchSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

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
    title: "Lý do",
    dataIndex: "description",
  },
  {
    title: "Người tạo",
    dataIndex: "creator",
    render: (creator: IUser) => creator?.fullName || "N/A",
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
    render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
  },
  {
    title: "",
    dataIndex: "method",
    fixed: "right",
  },
];

const BusyScheduleActions = ({
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

const BusyScheduleList = () => {
  const [searchParams, setSearchParams] = useState<{
    name?: string;
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
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
    data: busySchedulesData,
    isFetching,
    refetch,
  } = useGetBusySchedulesQuery(searchParams);

  const [fetchBusyScheduleDetail, { data: busyScheduleDetail }] =
    useLazyGetBusyScheduleByIdQuery();

  const [updateBusyScheduleStatus, { isLoading: isUpdatingStatus }] =
    useUpdateBusyScheduleStatusMutation();

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  const tableColumns = columnsTitles.map((item, index) => {
    if (item.dataIndex === "method") {
      return {
        ...item,
        key: index,
        render: (record: IRequest) => (
          <BusyScheduleActions
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
      busySchedulesData?.data?.items.map((item, index) => ({
        ...item,
        index: ((current || 1) - 1) * (pageSize || 10) + index + 1,
        method: item,
      })) || []
    );
  }, [busySchedulesData, current, pageSize]);

  useEffect(() => {
    if (busySchedulesData?.data) {
      setPagination((prev) => ({
        ...prev,
        current: busySchedulesData.data.page || prev.current,
        pageSize: busySchedulesData.data.limit || prev.pageSize,
        total: busySchedulesData.data.total || 0,
      }));
    }
  }, [busySchedulesData]);

  const onSubmitSearch = (data: SearchFormData) => {
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
    fetchBusyScheduleDetail(id);
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
      await updateBusyScheduleStatus({
        id: selectedItemId,
        action: RequestAction.APPROVE,
      }).unwrap();
      toast.success("Yêu cầu được phê duyệt thành công");
      refetch();
      dispatch(closeApproveModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCancel = async () => {
    if (!selectedItemId) return;

    try {
      await updateBusyScheduleStatus({
        id: selectedItemId,
        action: RequestAction.CANCEL,
      }).unwrap();
      toast.success("Yêu cầu được hủy bỏ thành công");
      refetch();
      dispatch(closeCancelModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleReject = async () => {
    if (!selectedItemId) return;
    try {
      await updateBusyScheduleStatus({
        id: selectedItemId,
        action: RequestAction.REJECT,
      }).unwrap();
      toast.success("Yêu cầu được từ chối thành công");
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
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.BUSY_SCHEDULE_LIST}>
      <div id="busy-schedules-container" className="flex flex-col gap-6">
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
            </FilterGrid>
            <div className="flex justify-between">
              <div className="flex gap-4">
                <CustomButton
                  title="Làm mới"
                  size="large"
                  onClick={handleReset}
                />
                <CustomButton
                  type="primary"
                  title="Tìm kiếm"
                  size="large"
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
        title="Chi tiết yêu cầu"
        open={isDetailModalOpen}
        onCancel={handleCloseDetail}
        footer={[
          <CustomButton
            key="close"
            title="Đóng"
            icon={<CloseOutlined />}
            onClick={handleCloseDetail}
          />,
          busyScheduleDetail?.data.status === RequestStatus.PENDING && (
            <CustomButton
              key="approve"
              type="primary"
              title="Phê duyệt"
              icon={<CheckOutlined />}
              onClick={() => handleOpenApproveModal(busyScheduleDetail.data.id)}
            />
          ),
          busyScheduleDetail?.data.status === RequestStatus.PENDING && (
            <CustomButton
              key="reject"
              type="primary"
              color="danger"
              title="Từ chối"
              icon={<CloseOutlined />}
              onClick={() => handleOpenRejectModal(busyScheduleDetail.data.id)}
            />
          ),
        ]}
        width={800}
      >
        {busyScheduleDetail ? (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.Text type="secondary">Tên yêu cầu:</Typography.Text>
              <Typography.Title level={5} className="mt-1">
                {busyScheduleDetail.data.name}
              </Typography.Title>
            </div>

            <div>
              <Typography.Text type="secondary">Lý do:</Typography.Text>
              <Typography.Paragraph className="mt-1">
                {busyScheduleDetail.data.description || ""}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">Người tạo:</Typography.Text>
              <Typography.Text className="ml-2">
                {busyScheduleDetail.data.creator?.fullName || "N/A"}
              </Typography.Text>
            </div>

            <div>
              <Typography.Text type="secondary">Người yêu cầu:</Typography.Text>
              <Typography.Text className="ml-2">
                {busyScheduleDetail.data.requester?.fullName || "N/A"}
              </Typography.Text>
            </div>

            <div>
              <Typography.Text type="secondary">Trạng thái:</Typography.Text>
              <span className="ml-2">
                <Tag color={REQUEST_STATUS_TAG[busyScheduleDetail.data.status]}>
                  {busyScheduleDetail.data.status}
                </Tag>
              </span>
            </div>

            <Divider orientation="left">Chi tiết yêu cầu</Divider>

            <div className="flex justify-between">
              <div>
                <Typography.Text type="secondary">Ngày tạo:</Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(busyScheduleDetail.data.createdAt).format(
                    DATE_TIME_FORMAT,
                  )}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text type="secondary">
                  Ngày cập nhật:
                </Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(busyScheduleDetail.data.updatedAt).format(
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
                className={`ml-2 ${isPastApprovalDeadline(busyScheduleDetail.data.createdAt) ? "font-medium text-red-500" : ""}`}
              >
                {calculateApprovalDeadline(busyScheduleDetail.data.createdAt)}
                {isPastApprovalDeadline(busyScheduleDetail.data.createdAt) && (
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

      {/* Approve Confirmation Modal */}
      <Modal
        title="Phê duyệt yêu cầu làm bận"
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
          Bạn có chắc chắn muốn phê duyệt yêu cầu này không?
        </Typography.Paragraph>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        title="Hủy bỏ yêu cầu"
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
          Bạn có chắc chắn muốn hủy bỏ yêu cầu này không? Hành động này không
          thể hoàn tác.
        </Typography.Paragraph>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        title="Từ chối yêu cầu"
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
          Bạn có chắc chắn muốn từ chối yêu cầu này không?
        </Typography.Paragraph>
      </Modal>
    </PageLayout>
  );
};

export default BusyScheduleList;
