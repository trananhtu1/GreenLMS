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
import CustomInputNumber from "@web/components/common/CustomInputNumber";
import CustomRangePicker from "@web/components/common/CustomRangePicker";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  TableColumn,
  calculateApprovalDeadline,
  isPastApprovalDeadline,
} from "@web/libs/common";
import {
  useCreateWeeklyNormMutation,
  useDeleteWeeklyNormMutation,
  useGetWeeklyNormsQuery,
  useLazyGetWeeklyNormByIdQuery,
  useUpdateWeeklyNormMutation,
  useUpdateWeeklyNormStatusMutation,
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
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.WEEKLY_NORM_REGISTRATION,
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

const WeeklyNormActions = ({
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
          title="View"
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

// Zod validation schema
const weeklyNormSchema = z.object({
  name: z.string().min(1, "Tên yêu cầu là bắt buộc"),
  description: z.string().optional(),
  weeklyNorms: z
    .array(
      z.object({
        rangeDate: z.tuple([
          z.any().refine((val) => !!val, "Ngày bắt đầu là bắt buộc"),
          z.any().refine((val) => !!val, "Ngày kết thúc là bắt buộc"),
        ]),
        quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
      }),
    )
    .min(1, "Ít nhất một định mức tuần là bắt buộc"),
});

type WeeklyNormFormValues = z.infer<typeof weeklyNormSchema>;

// Add search form schema
const searchFormSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const WeeklyNormRegistration = () => {
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
    data: weeklyNormsData,
    isFetching,
    refetch,
  } = useGetWeeklyNormsQuery(searchParams);

  const [fetchNormDetail, { data: normDetail }] =
    useLazyGetWeeklyNormByIdQuery();

  const [createWeeklyNorm, { isLoading: isCreating }] =
    useCreateWeeklyNormMutation();
  const [updateWeeklyNorm, { isLoading: isUpdating }] =
    useUpdateWeeklyNormMutation();
  const [updateWeeklyNormStatus, { isLoading: isCanceling }] =
    useUpdateWeeklyNormStatusMutation();
  const [deleteWeeklyNorm, { isLoading: isDeleting }] =
    useDeleteWeeklyNormMutation();

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  const weeklyNormForm = useForm<WeeklyNormFormValues>({
    resolver: zodResolver(weeklyNormSchema),
    defaultValues: {
      name: "",
      description: "",
      weeklyNorms: [
        {
          rangeDate: [undefined, undefined],
          quantity: 1,
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: weeklyNormForm.control,
    name: "weeklyNorms",
  });

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          key: index,
          render: (record: IRequest) => (
            <WeeklyNormActions
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
      weeklyNormsData?.data?.items.map((item, index) => ({
        ...item,
        index: ((current || 1) - 1) * (pageSize || 10) + index + 1,
        method: item,
      })) || []
    );
  }, [weeklyNormsData, current, pageSize]);

  // Add this useEffect to update pagination when data changes
  useEffect(() => {
    if (weeklyNormsData?.data) {
      setPagination((prev) => ({
        ...prev,
        current: weeklyNormsData.data.page || prev.current,
        pageSize: weeklyNormsData.data.limit || prev.pageSize,
        total: weeklyNormsData.data.total || 0,
      }));
    }
  }, [weeklyNormsData]);

  const handleStartEdit = async (id: string) => {
    dispatch(setSelectedItemId(id));
    dispatch(setEditMode(true));
    dispatch(closeDetailModal());

    try {
      const response = await fetchNormDetail(id).unwrap();
      if (response?.data) {
        // Populate form with fetched data
        weeklyNormForm.setValue("name", response.data.name);
        weeklyNormForm.setValue("description", response.data.description || "");

        if (response.data.weeklyNorms && response.data.weeklyNorms.length > 0) {
          const formattedNorms = response.data.weeklyNorms.map((norm) => ({
            rangeDate: [dayjs(norm.startDate), dayjs(norm.endDate)] as [
              Dayjs,
              Dayjs,
            ],
            quantity: norm.quantity,
          }));
          replace(formattedNorms);
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
    fetchNormDetail(id);
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
      await updateWeeklyNormStatus({
        id: selectedItemId,
        action: RequestAction.CANCEL,
      }).unwrap();
      toast.success("đăng ký định mức tuần đã được hủy bỏ thành công");
      refetch();
      dispatch(closeCancelModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const onSubmitCreate = async (data: WeeklyNormFormValues) => {
    const formattedData = {
      name: data.name,
      description: data.description || "",
      type: RequestType.WEEKLY_NORM,
      weeklyNorms: data.weeklyNorms.map((norm) => ({
        startDate: norm.rangeDate[0],
        endDate: norm.rangeDate[1],
        quantity: Number(norm.quantity),
      })),
    };

    try {
      if (isEditMode && normDetail?.data) {
        const res = await updateWeeklyNorm({
          id: normDetail.data.id,
          data: formattedData,
        }).unwrap();
        toast.success(res.message);
      } else {
        const res = await createWeeklyNorm(formattedData).unwrap();
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
    weeklyNormForm.reset();
    dispatch(setEditMode(false));
    dispatch(setSelectedItemId(null));
  };

  const addNormEntry = () => {
    append({
      rangeDate: [undefined, undefined],
      quantity: 1,
    });
  };

  const removeNormEntry = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("Ít nhất một định mức tuần là bắt buộc");
    }
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
      await deleteWeeklyNorm(selectedItemId).unwrap();
      toast.success("đăng ký định mức tuần đã được xóa thành công");
      refetch();
      dispatch(closeDeleteModal());
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  // Function to disable Tuesday through Saturday (days 2-6 in JS, where Sunday is 0)
  const disableDate = (current: Dayjs) => {
    const day = current.day();
    // Disable Tuesday(2) through Saturday(6)
    return day >= 2 && day <= 6;
  };

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      title={NAV_TITLE.WEEKLY_NORM_REGISTRATION}
    >
      <div id="weekly-norms-container" className="flex flex-col gap-6">
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
                title="Tạo đăng ký định mức tuần"
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
        title="Chi tiết đăng ký định mức tuần"
        open={isDetailModalOpen}
        onCancel={handleCloseDetail}
        footer={[
          <CustomButton
            key="close"
            title="Đóng"
            icon={<CloseOutlined />}
            onClick={handleCloseDetail}
          />,
          !isPastApprovalDeadline(normDetail?.data?.createdAt) && (
            <CustomButton
              key="edit"
              type="primary"
              title="Cập nhật"
              icon={<EditOutlined />}
              onClick={() => handleStartEdit(normDetail.data.id)}
            />
          ),
        ]}
        width={800}
      >
        {normDetail ? (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.Text type="secondary">Tên yêu cầu:</Typography.Text>
              <Typography.Title level={5} className="mt-1">
                {normDetail.data.name}
              </Typography.Title>
            </div>

            <div>
              <Typography.Text type="secondary">Mô tả:</Typography.Text>
              <Typography.Paragraph className="mt-1">
                {normDetail.data.description || ""}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">Trạng thái:</Typography.Text>
              <span className="ml-2">
                <Tag color={REQUEST_STATUS_TAG[normDetail.data.status]}>
                  {normDetail.data.status}
                </Tag>
              </span>
            </div>

            <Divider orientation="left">Chi tiết định mức tuần</Divider>

            {normDetail.data.weeklyNorms &&
              normDetail.data.weeklyNorms.map((norm, index) => (
                <Card key={index} size="small" className="mb-4">
                  <div className="flex justify-between">
                    <Typography.Text strong>Tuần #{index + 1}</Typography.Text>
                    <Typography.Text strong>
                      Số lượng: {norm.quantity}
                    </Typography.Text>
                  </div>
                  <Typography.Text>
                    {dayjs(norm.startDate).format(DATE_FORMAT)} -{" "}
                    {dayjs(norm.endDate).format(DATE_FORMAT)}
                  </Typography.Text>
                </Card>
              ))}

            <div className="flex justify-between">
              <div>
                <Typography.Text type="secondary">Ngày tạo:</Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(normDetail.data.createdAt).format(DATE_TIME_FORMAT)}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text type="secondary">
                  Ngày cập nhật:
                </Typography.Text>
                <Typography.Text className="ml-2">
                  {dayjs(normDetail.data.updatedAt).format(DATE_TIME_FORMAT)}
                </Typography.Text>
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Ngày hạn phê duyệt:
              </Typography.Text>
              <Typography.Text
                className={`ml-2 ${isPastApprovalDeadline(normDetail.data.createdAt) ? "font-medium text-red-500" : ""}`}
              >
                {calculateApprovalDeadline(normDetail.data.createdAt)}
                {isPastApprovalDeadline(normDetail.data.createdAt) && (
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
        title={
          isEditMode
            ? "Cập nhật đăng ký định mức tuần"
            : "Tạo đăng ký định mức tuần"
        }
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={weeklyNormForm.handleSubmit(onSubmitCreate)}
        loading={isCreating || isUpdating}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={weeklyNormForm.control}
            name="name"
            label="Tên yêu cầu"
            placeholder="Nhập tên yêu cầu"
            size="large"
            required
          />

          <CustomInput
            control={weeklyNormForm.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả (tùy chọn)"
            size="large"
          />

          <Divider orientation="left">Chi tiết định mức tuần</Divider>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-md border border-gray-200 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <Typography.Title level={5} className="m-0">
                  Định mức tuần #{index + 1}
                </Typography.Title>
                <CustomButton
                  type="text"
                  color="danger"
                  variant="text"
                  icon={<DeleteOutlined />}
                  onClick={() => removeNormEntry(index)}
                  disabled={fields.length <= 1}
                />
              </div>

              <CustomRangePicker
                control={weeklyNormForm.control}
                name={`weeklyNorms.${index}.rangeDate`}
                label="Ngày bắt đầu - Ngày kết thúc"
                size="large"
                disableDate={disableDate}
                required
              />

              <CustomInputNumber
                control={weeklyNormForm.control}
                name={`weeklyNorms.${index}.quantity`}
                label="Định mức"
                min={1}
                size="large"
                required
              />
            </div>
          ))}

          <CustomButton
            type="dashed"
            title="Thêm định mức tuần"
            onClick={addNormEntry}
            icon={<PlusOutlined />}
            className="mt-2"
            size="large"
          />
        </div>
      </CustomDrawer>
      {/* Cancel Confirmation Modal */}
      <Modal
        title="Hủy bỏ đăng ký định mức tuần"
        open={isCancelModalOpen}
        onCancel={() => dispatch(closeCancelModal())}
        footer={[
          <CustomButton
            key="back"
            title="Không, giữ nguyên"
            onClick={() => dispatch(closeCancelModal())}
            icon={<CloseOutlined />}
          />,
          <CustomButton
            key="submit"
            type="primary"
            color="danger"
            title="Có, hủy bỏ"
            icon={<StopOutlined />}
            loading={isCanceling}
            onClick={handleCancel}
          />,
        ]}
      >
        <Typography.Paragraph>
          Bạn có chắc chắn muốn hủy bỏ đăng ký định mức tuần này? Hành động này
          không thể hoàn tác.
        </Typography.Paragraph>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa đăng ký định mức tuần"
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
          Bạn có chắc chắn muốn xóa đăng ký định mức tuần này? Hành động này
          không thể hoàn tác.
        </Typography.Paragraph>
      </Modal>
    </PageLayout>
  );
};

export default WeeklyNormRegistration;
