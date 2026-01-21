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
import CustomDatePicker from "@web/components/common/CustomDatePicker";
import CustomDrawer from "@web/components/common/CustomDrawer";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTimePicker from "@web/components/common/CustomTimePicker";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  TIME_FORMAT,
  TableColumn,
  calculateApprovalDeadline,
  isPastApprovalDeadline,
} from "@web/libs/common";
import {
  useCreateBusyScheduleMutation,
  useDeleteBusyScheduleMutation,
  useGetBusySchedulesQuery,
  useLazyGetBusyScheduleByIdQuery,
  useUpdateBusyScheduleMutation,
  useUpdateBusyScheduleStatusMutation,
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
  ISchedule,
  REQUEST_STATUS_TAG,
  RequestAction,
  RequestStatus,
  RequestStatusOptions,
  RequestType,
} from "@web/libs/request";
import { RootState } from "@web/libs/store";
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
    title: NAV_TITLE.BUSY_SCHEDULE_REGISTRATION,
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
    title: "Lý do",
    dataIndex: "description",
  },
  {
    title: "Ngày",
    dataIndex: "schedules",
    render: (schedules: ISchedule[]) =>
      schedules &&
      schedules.length > 0 &&
      dayjs(schedules[0].startDate).format(DATE_FORMAT),
  },
  {
    title: "Thời gian",
    dataIndex: "schedules",
    render: (schedules: ISchedule[]) =>
      schedules &&
      schedules.length > 0 &&
      `${dayjs(schedules[0]?.startDate).format(TIME_FORMAT)} - ${dayjs(schedules[0]?.endDate).format(TIME_FORMAT)}`,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: (status: RequestStatus) => (
      <Tag color={REQUEST_STATUS_TAG[status]}>{status}</Tag>
    ),
  },
  {
    title: "Ngày hạn chấp nhận",
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

const BusyScheduleActions = ({
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

const busyScheduleSchema = z.object({
  name: z.string().min(1, "Tên yêu cầu là bắt buộc"),
  description: z.string().min(1, "Lý do là bắt buộc"),
  date: z.any().refine((val) => !!val, "Ngày là bắt buộc"),
  startTime: z.any().refine((val) => !!val, "Thời gian bắt đầu là bắt buộc"),
  endTime: z.any().refine((val) => !!val, "Thời gian kết thúc là bắt buộc"),
});

type BusyScheduleFormValues = z.infer<typeof busyScheduleSchema>;

// Add search form schema
const searchFormSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const BusyScheduleRegistration = () => {
  const [searchParams, setSearchParams] = useState<{
    name?: string;
    status?: string;
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
    data: busySchedulesData,
    isFetching,
    refetch,
  } = useGetBusySchedulesQuery(searchParams);

  const [fetchBusyScheduleDetail, { data: busyScheduleDetail }] =
    useLazyGetBusyScheduleByIdQuery();

  const [createBusySchedule, { isLoading: isCreating }] =
    useCreateBusyScheduleMutation();
  const [updateBusySchedule, { isLoading: isUpdating }] =
    useUpdateBusyScheduleMutation();
  const [updateBusyScheduleStatus, { isLoading: isCanceling }] =
    useUpdateBusyScheduleStatusMutation();

  const [deleteBusySchedule, { isLoading: isDeleting }] =
    useDeleteBusyScheduleMutation();

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  // Update the busyScheduleForm to use zod validation
  const busyScheduleForm = useForm<BusyScheduleFormValues>({
    resolver: zodResolver(busyScheduleSchema),
    defaultValues: {
      name: "",
      description: "",
      date: null, // Initially empty, will be validated by zod on submit
      startTime: null,
      endTime: null,
    },
  });

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          key: index,
          render: (record: IRequest) => (
            <BusyScheduleActions
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

  const handleStartEdit = async (id: string) => {
    dispatch(setSelectedItemId(id));
    dispatch(setEditMode(true));
    dispatch(closeDetailModal());

    try {
      const response = await fetchBusyScheduleDetail(id).unwrap();
      if (response?.data) {
        // Populate form with fetched data
        busyScheduleForm.setValue("name", response.data.name);
        busyScheduleForm.setValue(
          "description",
          response.data.description || "",
        );

        if (response.data.schedules && response.data.schedules.length > 0) {
          busyScheduleForm.setValue(
            "date",
            dayjs(response.data.schedules[0].startDate),
          );
          busyScheduleForm.setValue(
            "startTime",
            dayjs(response.data.schedules[0].startDate),
          );
          busyScheduleForm.setValue(
            "endTime",
            dayjs(response.data.schedules[0].endDate),
          );
        }
      }
      // Open the drawer after data is loaded
      dispatch(openCreateModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const onSubmitSearch = (data: { name?: string; status?: string }) => {
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

  const handleOpenCancelModal = (id: string) => {
    dispatch(openCancelModal(id));
  };

  const handleCancel = async () => {
    if (!selectedItemId) return;

    try {
      await updateBusyScheduleStatus({
        id: selectedItemId,
        action: RequestAction.CANCEL,
      }).unwrap();
      toast.success("Busy schedule request canceled successfully");
      refetch();
      dispatch(closeCancelModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const onSubmitCreate = async (data: BusyScheduleFormValues) => {
    // Create a date object for the selected date
    const selectedDate = data.date.toDate();

    // Create start and end datetime by combining the date with selected times
    const startDateTime = data.startTime.toDate();
    const endDateTime = data.endTime.toDate();

    // Set the date component of startDateTime and endDateTime to match the selected date
    startDateTime.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );
    endDateTime.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );

    const formattedData = {
      name: data.name,
      description: data.description || "",
      type: RequestType.BUSY_SCHEDULE,
      startDate: startDateTime,
      endDate: endDateTime,
    };

    try {
      if (isEditMode && busyScheduleDetail.data) {
        const res = await updateBusySchedule({
          id: busyScheduleDetail.data.id,
          data: formattedData,
        }).unwrap();
        toast.success(res.message);
      } else {
        const res = await createBusySchedule(formattedData).unwrap();
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
    busyScheduleForm.reset();
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

  const handleOpenDeleteModal = (id: string) => {
    dispatch(openDeleteModal(id));
  };

  const handleDelete = async () => {
    if (!selectedItemId) return;

    try {
      await deleteBusySchedule(selectedItemId).unwrap();
      toast.success("Busy schedule request deleted successfully");
      refetch();
      dispatch(closeDeleteModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      title={NAV_TITLE.BUSY_SCHEDULE_REGISTRATION}
    >
      <div id="busy-schedule-container" className="flex flex-col gap-6">
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
                title="Tạo yêu cầu"
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
          !isPastApprovalDeadline(busyScheduleDetail?.data?.createdAt) && (
            <CustomButton
              key="edit"
              type="primary"
              title="Cập nhật"
              icon={<EditOutlined />}
              onClick={() => handleStartEdit(busyScheduleDetail.data.id)}
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
              <Typography.Text type="secondary">Trạng thái:</Typography.Text>
              <span className="ml-2">
                <Tag color={REQUEST_STATUS_TAG[busyScheduleDetail.data.status]}>
                  {busyScheduleDetail.data.status}
                </Tag>
              </span>
            </div>

            <Divider orientation="left">Chi tiết yêu cầu</Divider>

            {busyScheduleDetail.data?.schedules &&
              busyScheduleDetail.data.schedules.length > 0 && (
                <Card size="small" className="mb-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <Typography.Text type="secondary">Ngày:</Typography.Text>
                      <Typography.Text className="ml-2">
                        {dayjs(
                          busyScheduleDetail.data.schedules[0].startDate,
                        ).format(DATE_FORMAT)}
                      </Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary">
                        Thời gian:
                      </Typography.Text>
                      <Typography.Text className="ml-2">
                        {dayjs(
                          busyScheduleDetail.data.schedules[0].startDate,
                        ).format(TIME_FORMAT)}{" "}
                        -{" "}
                        {dayjs(
                          busyScheduleDetail.data.schedules[0].endDate,
                        ).format(TIME_FORMAT)}
                      </Typography.Text>
                    </div>
                  </div>
                </Card>
              )}

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
                Ngày hạn chấp nhận:
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
      {/* Create/Edit Drawer - Notice there's no field array or add/remove buttons */}
      <CustomDrawer
        title={isEditMode ? "Cập nhật yêu cầu" : "Tạo yêu cầu"}
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={busyScheduleForm.handleSubmit(onSubmitCreate)}
        loading={isCreating || isUpdating}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={busyScheduleForm.control}
            name="name"
            label="Tên yêu cầu"
            placeholder="Nhập tên yêu cầu"
            size="large"
            required
          />

          <CustomInput
            control={busyScheduleForm.control}
            name="description"
            label="Lý do"
            placeholder="Nhập lý do cho yêu cầu"
            size="large"
            required
          />

          <Divider orientation="left">Chi tiết yêu cầu</Divider>

          <div className="flex flex-col gap-2">
            <CustomDatePicker
              control={busyScheduleForm.control}
              name="date"
              label="Ngày"
              size="large"
              placeholder="Chọn ngày"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <CustomTimePicker
                control={busyScheduleForm.control}
                name="startTime"
                label="Thời gian bắt đầu"
                size="large"
                placeholder="Thời gian bắt đầu"
                required
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <CustomTimePicker
                control={busyScheduleForm.control}
                name="endTime"
                label="Thời gian kết thúc"
                size="large"
                format="HH:mm"
                placeholder="Thời gian kết thúc"
                required
              />
            </div>
          </div>
        </div>
      </CustomDrawer>
      {/* Cancel Confirmation Modal */}
      <Modal
        title="Hủy bỏ yêu cầu"
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
          Bạn có chắc chắn muốn hủy bỏ yêu cầu này không? Hành động này không
          thể được hoàn tác.
        </Typography.Paragraph>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa yêu cầu"
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
          Bạn có chắc chắn muốn xóa yêu cầu này không? Hành động này không thể
          được hoàn tác.
        </Typography.Paragraph>
      </Modal>
    </PageLayout>
  );
};

export default BusyScheduleRegistration;
