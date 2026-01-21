"use client";
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
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
  formatRangeDate,
  isPastApprovalDeadline,
} from "@web/libs/common";
import {
  useCreateTimeOffMutation,
  useDeleteTimeOffMutation,
  useGetTimeOffsQuery,
  useLazyGetTimeOffByIdQuery,
  useUpdateTimeOffMutation,
  useUpdateTimeOffStatusMutation,
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
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.TIME_OFF_REGISTRATION,
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
    title: "Người phê duyệt",
    dataIndex: "approver",
    render: (approver: IUser) => approver?.fullName,
  },
  {
    title: "Lịch nghỉ",
    dataIndex: "schedules",
    render: (schedules: ISchedule[]) => {
      if (!schedules || schedules.length === 0) return;
      return (
        <div className="space-y-1">
          {schedules.map((schedule, index) => (
            <div key={index} className="text-sm">
              {formatRangeDate(schedule.startDate, schedule.endDate)}
            </div>
          ))}
        </div>
      );
    },
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

const TimeOffActions = ({
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
          icon={<CloseOutlined />}
          onClick={() => onOpenCancelModal(record.id)}
        />
      )}
    </CustomDropdown>
  );
};

const timeOffSchema = z.object({
  name: z.string().min(1, "Tên yêu cầu là bắt buộc"),
  description: z.string().optional(),
  schedules: z
    .array(
      z.object({
        date: z.any().refine((val) => !!val, "Ngày là bắt buộc"),
        startTime: z.any().refine((val) => !!val, "Giờ bắt đầu là bắt buộc"),
        endTime: z.any().refine((val) => !!val, "Giờ kết thúc là bắt buộc"),
      }),
    )
    .min(1, "Ít nhất một lịch trình là bắt buộc"),
});

type TimeOffFormValues = z.infer<typeof timeOffSchema>;

// Add search form schema
const searchFormSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const TimeOffRegistration = () => {
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
    data: timeOffsData,
    isFetching,
    refetch,
  } = useGetTimeOffsQuery(searchParams);

  const [fetchTimeOffDetail, { data: timeOffDetail }] =
    useLazyGetTimeOffByIdQuery();

  const [createTimeOff, { isLoading: isCreating }] = useCreateTimeOffMutation();
  const [updateTimeOff, { isLoading: isUpdating }] = useUpdateTimeOffMutation();
  const [updateTimeOffStatus, { isLoading: isCanceling }] =
    useUpdateTimeOffStatusMutation();

  const [deleteTimeOff, { isLoading: isDeleting }] = useDeleteTimeOffMutation();

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  const timeOffForm = useForm<TimeOffFormValues>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: {
      name: "",
      description: "",
      schedules: [
        {
          date: null,
          startTime: null,
          endTime: null,
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: timeOffForm.control,
    name: "schedules",
  });

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          key: index,
          render: (record: IRequest) => (
            <TimeOffActions
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
      timeOffsData?.data?.items.map((item, index) => ({
        ...item,
        index: ((current || 1) - 1) * (pageSize || 10) + index + 1,
        method: item,
      })) || []
    );
  }, [timeOffsData, current, pageSize]);

  useEffect(() => {
    if (timeOffsData?.data) {
      setPagination((prev) => ({
        ...prev,
        current: timeOffsData.data.page || prev.current,
        pageSize: timeOffsData.data.limit || prev.pageSize,
        total: timeOffsData.data.total || 0,
      }));
    }
  }, [timeOffsData]);

  const handleStartEdit = async (id: string) => {
    dispatch(setSelectedItemId(id));
    dispatch(setEditMode(true));
    dispatch(closeDetailModal());

    try {
      const response = await fetchTimeOffDetail(id).unwrap();
      if (response?.data) {
        timeOffForm.setValue("name", response.data.name);
        timeOffForm.setValue("description", response.data.description || "");

        if (response.data.schedules && response.data.schedules.length > 0) {
          const formattedSchedules = response.data.schedules.map(
            (schedule) => ({
              date: dayjs(schedule.startDate),
              startTime: dayjs(schedule.startDate),
              endTime: dayjs(schedule.endDate),
            }),
          );
          replace(formattedSchedules);
        }
      }
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
    fetchTimeOffDetail(id);
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

  const handleCancel = async () => {
    if (!selectedItemId) return;

    try {
      await updateTimeOffStatus({
        id: selectedItemId,
        action: RequestAction.CANCEL,
      }).unwrap();
      toast.success("Yêu cầu nghỉ cố định đã được hủy bỏ thành công");
      refetch();
      dispatch(closeCancelModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleDelete = async () => {
    if (!selectedItemId) return;

    try {
      await deleteTimeOff(selectedItemId).unwrap();
      toast.success("Yêu cầu nghỉ cố định đã được xóa thành công");
      refetch();
      dispatch(closeDeleteModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const onSubmitCreate = async (data: TimeOffFormValues) => {
    const formattedSchedules = data.schedules.map((schedule) => {
      const selectedDate = schedule.date.toDate();
      const startDateTime = schedule.startTime.toDate();
      const endDateTime = schedule.endTime.toDate();

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

      return {
        startDate: startDateTime,
        endDate: endDateTime,
      };
    });

    const formattedData = {
      name: data.name,
      description: data.description || "",
      type: RequestType.TIME_OFF,
      schedules: formattedSchedules,
    };

    try {
      if (isEditMode && timeOffDetail?.data) {
        const res = await updateTimeOff({
          id: timeOffDetail.data.id,
          data: formattedData,
        }).unwrap();
        toast.success(res.message);
      } else {
        const res = await createTimeOff(formattedData).unwrap();
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
    timeOffForm.reset();
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

  const addScheduleEntry = () => {
    append({
      date: null,
      startTime: null,
      endTime: null,
    });
  };

  const removeScheduleEntry = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("At least one schedule is required");
    }
  };

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      title={NAV_TITLE.TIME_OFF_REGISTRATION}
    >
      <div id="time-off-container" className="flex flex-col gap-6">
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
                title="Tạo yêu cầu nghỉ cố định"
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
      <Modal
        title="Chi tiết yêu cầu nghỉ cố định"
        open={isDetailModalOpen}
        onCancel={handleCloseDetail}
        footer={[
          <CustomButton
            key="close"
            title="Đóng"
            icon={<CloseOutlined />}
            onClick={handleCloseDetail}
          />,
          timeOffDetail?.data?.status === RequestStatus.PENDING &&
            !isPastApprovalDeadline(timeOffDetail?.data?.createdAt) && (
              <CustomButton
                key="edit"
                type="primary"
                title="Cập nhật"
                icon={<EditOutlined />}
                onClick={() => handleStartEdit(timeOffDetail.data.id)}
              />
            ),
        ]}
        width={800}
      >
        {timeOffDetail ? (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.Text type="secondary">Tên yêu cầu:</Typography.Text>
              <Typography.Title level={5} className="mt-1">
                {timeOffDetail.data.name}
              </Typography.Title>
            </div>

            <div>
              <Typography.Text type="secondary">Mô tả:</Typography.Text>
              <Typography.Paragraph className="mt-1">
                {timeOffDetail.data.description || ""}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">Trạng thái:</Typography.Text>
              <span className="ml-2">
                <Tag color={REQUEST_STATUS_TAG[timeOffDetail.data.status]}>
                  {timeOffDetail.data.status}
                </Tag>
              </span>
            </div>

            <Divider orientation="left">Chi tiết lịch nghỉ cố định</Divider>

            {timeOffDetail.data?.schedules &&
              timeOffDetail.data.schedules.map((schedule, index) => (
                <Card key={index} size="small" className="mb-4">
                  <div className="flex justify-between">
                    <Typography.Text strong>
                      Lịch nghỉ cố định #{index + 1}
                    </Typography.Text>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div>
                      <Typography.Text type="secondary">Ngày:</Typography.Text>
                      <Typography.Text className="ml-2">
                        {dayjs(schedule.startDate).format(DATE_FORMAT)}
                      </Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary">Giờ:</Typography.Text>
                      <Typography.Text className="ml-2">
                        {dayjs(schedule.startDate).format(TIME_FORMAT)} -{" "}
                        {dayjs(schedule.endDate).format(TIME_FORMAT)}
                      </Typography.Text>
                    </div>
                  </div>
                </Card>
              ))}

            <div className="flex justify-between">
              <div>
                <Typography.Text type="secondary">Ngày tạo:</Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(timeOffDetail.data.createdAt).format(DATE_TIME_FORMAT)}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text type="secondary">
                  Ngày cập nhật:
                </Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(timeOffDetail.data.updatedAt).format(DATE_TIME_FORMAT)}
                </Typography.Text>
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Ngày hạn phê duyệt:
              </Typography.Text>
              <Typography.Text
                className={`ml-2 ${isPastApprovalDeadline(timeOffDetail.data.createdAt) ? "font-medium text-red-500" : ""}`}
              >
                {calculateApprovalDeadline(timeOffDetail.data.createdAt)}
                {isPastApprovalDeadline(timeOffDetail.data.createdAt) && (
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
      <CustomDrawer
        title={
          isEditMode
            ? "Cập nhật yêu cầu nghỉ cố định"
            : "Tạo yêu cầu nghỉ cố định"
        }
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={timeOffForm.handleSubmit(onSubmitCreate)}
        loading={isCreating || isUpdating}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={timeOffForm.control}
            name="name"
            label="Tên yêu cầu"
            placeholder="Nhập tên yêu cầu"
            size="large"
            required
          />

          <CustomInput
            control={timeOffForm.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả (tùy chọn)"
            size="large"
          />

          <Divider orientation="left">Chi tiết lịch nghỉ cố định</Divider>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-md border border-gray-200 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <Typography.Title level={5} className="m-0">
                  Lịch nghỉ cố định #{index + 1}
                </Typography.Title>
                <CustomButton
                  type="text"
                  color="danger"
                  variant="text"
                  icon={<DeleteOutlined />}
                  onClick={() => removeScheduleEntry(index)}
                  disabled={fields.length <= 1}
                />
              </div>

              <CustomDatePicker
                control={timeOffForm.control}
                name={`schedules.${index}.date`}
                label="Ngày"
                size="large"
                placeholder="Chọn ngày"
                required
              />

              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <CustomTimePicker
                    control={timeOffForm.control}
                    name={`schedules.${index}.startTime`}
                    label="Giờ bắt đầu"
                    size="large"
                    placeholder="Giờ bắt đầu"
                    required
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <CustomTimePicker
                    control={timeOffForm.control}
                    name={`schedules.${index}.endTime`}
                    label="Giờ kết thúc"
                    size="large"
                    format="HH:mm"
                    placeholder="Giờ kết thúc"
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <CustomButton
            type="dashed"
            title="Tạo lịch nghỉ cố định"
            onClick={addScheduleEntry}
            icon={<PlusOutlined />}
            className="mt-2"
            size="large"
          />
        </div>
      </CustomDrawer>
      <Modal
        title="Hủy bỏ yêu cầu nghỉ cố định"
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
          Bạn có chắc chắn muốn hủy bỏ yêu cầu nghỉ cố định này? Hành động này
          không thể hoàn tác.
        </Typography.Paragraph>
      </Modal>
      <Modal
        title="Xóa yêu cầu nghỉ cố định"
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
          Bạn có chắc chắn muốn xóa yêu cầu nghỉ cố định này? Hành động này
          không thể hoàn tác.
        </Typography.Paragraph>
      </Modal>
    </PageLayout>
  );
};

export default TimeOffRegistration;
