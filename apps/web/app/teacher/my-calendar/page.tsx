"use client";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomDrawer from "@web/components/common/CustomDrawer";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTextArea from "@web/components/common/CustomTextArea";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import { useCreateBusyScheduleMutation } from "@web/libs/features/requests/requestApi";
import { useGetSchedulesQuery } from "@web/libs/features/schedules/scheduleApi";
import { useGetWeeklyNormsQuery } from "@web/libs/features/weekly-norms/weeklyNormApi";
import { NAV_TITLE } from "@web/libs/nav";
import {
  SCHEDULE_TYPE_LABEL,
  SCHEDULE_TYPE_OPTIONS,
  SCHEDULE_TYPE_TAG,
} from "@web/libs/schedule";
import {
  Card,
  DatePicker,
  Divider,
  Modal,
  Tag,
  TimePicker,
  Typography,
} from "antd";
import AntdCalendar from "antd-calendar";
import { EventType } from "antd-calendar/dist/constants";
import { IEvent } from "antd-calendar/dist/types";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.MY_TEACHER_CALENDAR,
  },
];

// Define validation schemas
const searchFormSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
});

const busyScheduleFormSchema = z.object({
  name: z.string().min(1, "Tên yêu cầu là bắt buộc"),
  description: z.string().optional(),
  date: z.any().refine((val) => !!val, "Ngày là bắt buộc"),
  startTime: z.any().refine((val) => !!val, "Thời gian bắt đầu là bắt buộc"),
  endTime: z.any().refine((val) => !!val, "Thời gian kết thúc là bắt buộc"),
});

// Define types based on the schemas
type SearchFormValues = z.infer<typeof searchFormSchema>;
type BusyScheduleFormValues = z.infer<typeof busyScheduleFormSchema>;

const MyCalendar = () => {
  const [isBusyScheduleModalOpen, setIsBusyScheduleModalOpen] = useState(false);
  // Add state for detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<IEvent[]>([]);

  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf("month").startOf("week").toISOString(),
    endDate: dayjs().endOf("month").endOf("week").toISOString(),
  });
  const [searchParams, setSearchParams] = useState<SearchFormValues>({
    name: undefined,
    type: undefined,
  });

  const { data: weeklyNorms, isFetching: isFetchingNorms } =
    useGetWeeklyNormsQuery(dateRange);
  const {
    data: schedules,
    isFetching: isFetchingSchedules,
    refetch: refetchSchedules,
  } = useGetSchedulesQuery({
    ...searchParams,
    ...dateRange,
  });
  const [createBusySchedule, { isLoading: isCreatingBusySchedule }] =
    useCreateBusyScheduleMutation();

  // Update forms with zod resolver
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  const busyScheduleForm = useForm<BusyScheduleFormValues>({
    resolver: zodResolver(busyScheduleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      date: null,
      startTime: null,
      endTime: null,
    },
  });

  const events = useMemo(() => {
    if (!schedules?.data) return [];

    return schedules.data.map((schedule) => ({
      id: schedule.id,
      title: schedule.name,
      startDate: dayjs(schedule.startDate).toDate(),
      endDate: dayjs(schedule.endDate).toDate(),
      type: schedule.type as unknown as EventType,
      description: schedule.description,
      classroomName: schedule.class?.room?.name,
    }));
  }, [schedules]);

  const norms = useMemo(() => {
    if (!weeklyNorms?.data) return [];

    return weeklyNorms.data.map((norm) => ({
      id: norm.id,
      startDate: dayjs(norm.startDate).toDate(),
      endDate: dayjs(norm.endDate).toDate(),
      maxShift: norm.quantity,
    }));
  }, [weeklyNorms]);

  const handleOpenDetail = useCallback((date: Date, events: IEvent[]) => {
    // Set the selected date and events
    setSelectedDate(date);
    setSelectedEvents(events);
    // Open the detail modal
    setIsDetailModalOpen(true);
  }, []);

  const handleOpenCreate = useCallback(
    (date: Date) => {
      // Pre-fill the date field with the selected date
      busyScheduleForm.setValue("date", dayjs(date));
      // Open the busy schedule modal using local state
      setIsBusyScheduleModalOpen(true);
    },
    [busyScheduleForm],
  );

  const handleRefetchAPI = useCallback(
    async (startDate: Date, endDate: Date) => {
      // Chỉ cập nhật dateRange khi dữ liệu thực sự thay đổi
      const newStartDate = dayjs(startDate).toISOString();
      const newEndDate = dayjs(endDate).toISOString();

      if (
        newStartDate !== dateRange.startDate ||
        newEndDate !== dateRange.endDate
      ) {
        setDateRange({
          startDate: newStartDate,
          endDate: newEndDate,
        });
      }

      return Promise.resolve();
    },
    [dateRange],
  );

  const onSubmitSearch = (data: SearchFormValues) => {
    setSearchParams({
      ...searchParams,
      ...data,
    });
  };

  const handleReset = () => {
    searchForm.reset();
    setSearchParams({
      ...searchParams,
      name: undefined,
      type: undefined,
    });
    refetchSchedules();
  };

  const handleCloseBusyScheduleModal = () => {
    setIsBusyScheduleModalOpen(false);
    busyScheduleForm.reset();
  };

  const onSubmitBusySchedule = async (data: BusyScheduleFormValues) => {
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
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
    };

    try {
      // Call the API to create busy schedule
      await createBusySchedule(formattedData).unwrap();
      toast.success("Yêu cầu đã được tạo thành công");
      handleCloseBusyScheduleModal();
    } catch (error) {
      toast.error(
        "Lỗi khi tạo yêu cầu: " + (error.data?.message || "Lỗi không xác định"),
      );
    }
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MY_TEACHER_CALENDAR}>
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="name"
                size="large"
                placeholder="Tìm kiếm theo tên sự kiện"
              />
              <CustomSelect
                control={searchForm.control}
                name="type"
                size="large"
                placeholder="Lọc theo loại sự kiện"
                options={SCHEDULE_TYPE_OPTIONS}
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
                onClick={() => setIsBusyScheduleModalOpen(true)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <AntdCalendar
            events={events}
            norms={norms}
            onOpenDetail={handleOpenDetail}
            onOpenCreate={handleOpenCreate}
            onRefetchAPI={handleRefetchAPI}
            loading={isFetchingNorms || isFetchingSchedules}
            weeklyNormTitle="Định mức"
            monthTitles={[
              "Thứ Hai",
              "Thứ Ba",
              "Thứ Tư",
              "Thứ Năm",
              "Thứ Sáu",
              "Thứ Bảy",
              "Chủ Nhật",
            ]}
            weekTitles={[
              "Thứ Hai",
              "Thứ Ba",
              "Thứ Tư",
              "Thứ Năm",
              "Thứ Sáu",
              "Thứ Bảy",
              "Chủ Nhật",
            ]}
          />
        </Card>

        {/* Busy Schedule Modal */}
        <CustomDrawer
          title="Tạo yêu cầu"
          open={isBusyScheduleModalOpen}
          onCancel={handleCloseBusyScheduleModal}
          onSubmit={busyScheduleForm.handleSubmit(onSubmitBusySchedule)}
          loading={isCreatingBusySchedule}
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

            <CustomTextArea
              control={busyScheduleForm.control}
              name="description"
              label="Lý do"
              placeholder="Nhập lý do cho yêu cầu"
              size="large"
              required
            />

            <Divider orientation="left">Chi tiết sự kiện</Divider>

            {/* Date picker */}
            <div className="flex flex-col gap-2">
              <Typography.Text>
                Ngày<span className="text-red-500">*</span>
              </Typography.Text>
              <DatePicker
                style={{ width: "100%" }}
                size="large"
                value={busyScheduleForm.watch("date")}
                onChange={(date) => busyScheduleForm.setValue("date", date)}
                placeholder="Chọn ngày"
                status={
                  busyScheduleForm.formState.errors.date ? "error" : undefined
                }
              />
              {busyScheduleForm.formState.errors.date && (
                <Typography.Text type="danger">
                  {busyScheduleForm.formState.errors.date.message as string}
                </Typography.Text>
              )}
            </div>

            {/* Time range */}
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Typography.Text>
                  Thời gian bắt đầu<span className="text-red-500">*</span>
                </Typography.Text>
                <TimePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="HH:mm"
                  value={busyScheduleForm.watch("startTime")}
                  onChange={(time) =>
                    busyScheduleForm.setValue("startTime", time)
                  }
                  placeholder="Thời gian bắt đầu"
                  status={
                    busyScheduleForm.formState.errors.startTime
                      ? "error"
                      : undefined
                  }
                />
                {busyScheduleForm.formState.errors.startTime && (
                  <Typography.Text type="danger">
                    {
                      busyScheduleForm.formState.errors.startTime
                        .message as string
                    }
                  </Typography.Text>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Typography.Text>
                  Thời gian kết thúc<span className="text-red-500">*</span>
                </Typography.Text>
                <TimePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="HH:mm"
                  value={busyScheduleForm.watch("endTime")}
                  onChange={(time) =>
                    busyScheduleForm.setValue("endTime", time)
                  }
                  placeholder="Thời gian kết thúc"
                  status={
                    busyScheduleForm.formState.errors.endTime
                      ? "error"
                      : undefined
                  }
                />
                {busyScheduleForm.formState.errors.endTime && (
                  <Typography.Text type="danger">
                    {
                      busyScheduleForm.formState.errors.endTime
                        .message as string
                    }
                  </Typography.Text>
                )}
              </div>
            </div>
          </div>
        </CustomDrawer>

        {/* Event Detail Modal */}
        <Modal
          title={dayjs(selectedDate).format("MMMM D, YYYY")}
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          footer={[
            <CustomButton
              key="close"
              title="Đóng"
              onClick={() => setIsDetailModalOpen(false)}
            />,
          ]}
        >
          {selectedEvents.length ? (
            <div className="max-h-[60vh] overflow-y-auto">
              {selectedEvents.map((event) => (
                <Card key={event.id} className="mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Typography.Title level={5}>
                        {event.title}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        {dayjs(event.startDate).format("HH:mm")} -{" "}
                        {dayjs(event.endDate).format("HH:mm")}
                      </Typography.Text>
                      {event.type && (
                        <div className="mt-2">
                          <Tag color={SCHEDULE_TYPE_TAG[event.type]}>
                            {SCHEDULE_TYPE_LABEL[event.type]}
                          </Tag>
                        </div>
                      )}
                      {event.classroomName && (
                        <div className="mt-2">
                          <Typography.Text type="secondary">
                            {event.classroomName}
                          </Typography.Text>
                        </div>
                      )}
                    </div>
                  </div>
                  {event.description && (
                    <div className="mt-2">
                      <Typography.Text type="secondary">
                        {event.description}
                      </Typography.Text>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Typography.Text type="secondary">
                Không có sự kiện cho ngày này
              </Typography.Text>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

export default MyCalendar;
