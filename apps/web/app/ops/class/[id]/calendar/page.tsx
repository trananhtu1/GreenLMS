"use client";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomCheckboxGroup from "@web/components/common/CustomCheckboxGroup";
import CustomDatePicker from "@web/components/common/CustomDatePicker";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTextArea from "@web/components/common/CustomTextArea";
import Loading from "@web/components/common/Loading";
import { SHIFTS_OPTIONS } from "@web/libs/class";
import { HOURS_PER_SESSION } from "@web/libs/common";
import {
  useGetClassByIdQuery,
  useGetClassSchedulesQuery,
} from "@web/libs/features/classes/classApi";
import {
  useCreateTeachingSchedulesMutation,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
} from "@web/libs/features/schedules/scheduleApi";
import { useGetWeeklyNormsQuery } from "@web/libs/features/weekly-norms/weeklyNormApi";
import {
  SCHEDULE_TYPE_LABEL,
  SCHEDULE_TYPE_TAG,
  WEEKDAY_OPTIONS,
} from "@web/libs/schedule";
import { Alert, Card, Modal, Tag, Typography } from "antd";
import AntdCalendar from "antd-calendar";
import { EventType } from "antd-calendar/dist/constants";
import { IEvent } from "antd-calendar/dist/types";
import dayjs, { Dayjs } from "dayjs";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// Define schedule form schema
const scheduleFormSchema = z.object({
  name: z.string().min(1, "Tên buổi học là bắt buộc"),
  description: z.string().optional(),
  startDate: z.any().refine((val) => !!val, "Ngày bắt đầu là bắt buộc"),
  endDate: z.any().refine((val) => !!val, "Ngày kết thúc là bắt buộc"),
  shift: z.string().min(1, "Ca học là bắt buộc"),
  weekdays: z
    .array(z.number())
    .min(1, "Ít nhất một ngày trong tuần phải được chọn"),
});

// Define types for schedule form
type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// Define edit schedule form schema
const editScheduleFormSchema = z.object({
  name: z.string().min(1, "Tên buổi học là bắt buộc"),
  description: z.string().optional(),
  eventDate: z.any().refine((val) => !!val, "Ngày là bắt buộc"),
  shift: z.string().min(1, "Ca học là bắt buộc"),
});

// Define types for edit schedule form
type EditScheduleFormValues = z.infer<typeof editScheduleFormSchema>;

const ScheduleActions = ({
  event,
  onEdit,
  onDelete,
  canDelete,
  isDeleting,
}: {
  event: IEvent;
  onEdit: (event: IEvent) => void;
  onDelete: (eventId: string) => void;
  canDelete: boolean;
  isDeleting: boolean;
}) => {
  if (!canDelete || event.type !== "TEACHING") {
    return null;
  }

  return (
    <CustomDropdown>
      <CustomButton
        type="link"
        title="Cập nhật"
        icon={<EditOutlined />}
        onClick={() => onEdit(event)}
      />
      <CustomButton
        type="link"
        title="Xóa"
        color="danger"
        icon={<DeleteOutlined />}
        loading={isDeleting}
        onClick={() => onDelete(event.id)}
      />
    </CustomDropdown>
  );
};

const ClassCalendar = () => {
  const { id: classId } = useParams<{ id: string }>();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<IEvent[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    null,
  );
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] =
    useState<IEvent | null>(null);

  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf("month").startOf("week").toISOString(),
    endDate: dayjs().endOf("month").endOf("week").toISOString(),
  });

  // Fetch class details to check if teacher is assigned
  const { data: classData, isLoading: isLoadingClass } = useGetClassByIdQuery(
    classId,
    {
      skip: !classId,
    },
  );

  const hasTeacher = classData?.data?.teacher?.id;
  const classStartDate = classData?.data?.startDate
    ? dayjs(classData.data.startDate)
    : null;
  const classEndDate = classData?.data?.endDate
    ? dayjs(classData.data.endDate)
    : null;
  const totalCourseHours = classData?.data?.course?.hours || 0;

  const {
    isLoading: isLoadingWeeklyNorms,
    data: weeklyNorms,
    isFetching: isFetchingWeeklyNorms,
    refetch: refetchWeeklyNorms,
  } = useGetWeeklyNormsQuery(
    {
      ...dateRange,
      teacherId: classData?.data?.teacher?.id,
    },
    {
      skip: !classData?.data?.teacher?.id,
    },
  );

  const {
    data: scheduleData,
    isLoading,
    refetch,
  } = useGetClassSchedulesQuery(
    {
      classId,
      ...dateRange,
    },
    {
      skip: !classId || !hasTeacher,
    },
  );

  // Calculate total scheduled hours
  const totalScheduledHours = useMemo(() => {
    if (!scheduleData?.data) return 0;

    return scheduleData.data.reduce((total, schedule) => {
      const start = dayjs(schedule.startDate);
      const end = dayjs(schedule.endDate);
      const hours = end.diff(start, "hour", true);
      return total + hours;
    }, 0);
  }, [scheduleData]);

  const remainingHours = totalCourseHours - totalScheduledHours;

  // Setup schedule form with zod resolver
  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      weekdays: [],
    },
  });

  // Setup edit schedule form with zod resolver
  const editScheduleForm = useForm<EditScheduleFormValues>({
    resolver: zodResolver(editScheduleFormSchema),
  });

  const [createMultipleSchedules, { isLoading: isCreatingSchedule }] =
    useCreateTeachingSchedulesMutation();
  const [deleteSchedule, { isLoading: isDeleting }] =
    useDeleteScheduleMutation();
  const [updateSchedule, { isLoading: isUpdatingSchedule }] =
    useUpdateScheduleMutation();

  // Watch form values for real-time calculation
  const watchedValues = scheduleForm.watch();

  // Calculate estimated hours and schedules count
  const estimatedData = useMemo(() => {
    const { startDate, endDate, shift, weekdays } = watchedValues;

    if (!startDate || !endDate || !shift || !weekdays?.length) {
      return { estimatedHours: 0, scheduleCount: 0 };
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let scheduleCount = 0;
    let currentDate = start;

    while (currentDate.isBefore(end)) {
      if (weekdays.includes(currentDate.day())) {
        scheduleCount++;
      }
      currentDate = currentDate.add(1, "day");
    }

    const estimatedHours = scheduleCount * HOURS_PER_SESSION;

    return { estimatedHours, scheduleCount };
  }, [watchedValues]);

  const events = useMemo(() => {
    if (!scheduleData?.data) return [];

    return scheduleData.data.map((schedule) => ({
      id: schedule.id,
      title: schedule.name || "Class Session",
      startDate: dayjs(schedule.startDate).toDate(),
      endDate: dayjs(schedule.endDate).toDate(),
      type: schedule.type as unknown as EventType,
      description: schedule.description,
      classroomName: schedule.class?.room?.name,
    }));
  }, [scheduleData]);

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
    setSelectedDate(date);
    setSelectedEvents(events);
    setIsDetailModalOpen(true);
  }, []);

  const handleRefetchAPI = useCallback(
    async (startDate: Date, endDate: Date) => {
      const newStartDate = dayjs(startDate).toISOString();
      const newEndDate = dayjs(endDate).toISOString();

      setDateRange({
        startDate: newStartDate,
        endDate: newEndDate,
      });

      return Promise.resolve();
    },
    [],
  );

  const handleOpenCreate = (date: Date) => {
    if (!hasTeacher) {
      toast.error("Vui lòng giao viên cho lớp trước khi thêm lịch học.");
      return;
    }

    setSelectedCalendarDate(date);
    const selectedDay = dayjs(date);

    scheduleForm.reset({
      name: classData?.data?.name || "Buổi học",
      description: "",
      startDate: selectedDay.toDate(),
      endDate: selectedDay.toDate(),
      shift: SHIFTS_OPTIONS[0].value,
      weekdays: [selectedDay.day()],
    });
    setIsAddScheduleModalOpen(true);
  };

  const handleOpenAddSchedule = () => {
    if (!hasTeacher) {
      toast.error("Vui lòng giao viên cho lớp trước khi thêm lịch học.");
      return;
    }

    scheduleForm.reset({
      name: classData?.data?.name || "Buổi học",
      description: "",
      startDate: null,
      endDate: null,
      shift: SHIFTS_OPTIONS[0].value,
      weekdays: [],
    });
    setSelectedCalendarDate(null);
    setIsAddScheduleModalOpen(true);
  };

  const generateSchedules = (data: ScheduleFormValues) => {
    const { startDate, endDate, weekdays, name, description } = data;

    const start = dayjs(startDate).startOf("day");
    const end = dayjs(endDate).endOf("day");
    const selectedShift = SHIFTS_OPTIONS.find(
      (shift) => shift.value === data.shift,
    );

    const schedules = [];
    let currentDate = start.clone();

    while (currentDate.isBefore(end)) {
      if (weekdays.includes(currentDate.day())) {
        const [startHour, startMinute] = selectedShift.startTime.split(":");
        const scheduleStartDate = currentDate
          .hour(parseInt(startHour))
          .minute(parseInt(startMinute))
          .second(0)
          .millisecond(0);

        const [endHour, endMinute] = selectedShift.endTime.split(":");
        const scheduleEndDate = currentDate
          .hour(parseInt(endHour))
          .minute(parseInt(endMinute))
          .second(0)
          .millisecond(0);

        schedules.push({
          name,
          description,
          startDate: scheduleStartDate.toDate(),
          endDate: scheduleEndDate.toDate(),
        });
      }
      currentDate = currentDate.add(1, "day");
    }

    return schedules;
  };

  const handleAddSchedule = async (data: ScheduleFormValues) => {
    try {
      if (!classId) return;

      const schedules = generateSchedules(data);

      await createMultipleSchedules({
        classId,
        schedules,
      }).unwrap();

      toast.success(`${schedules.length} buổi học đã được tạo thành công`);
      setIsAddScheduleModalOpen(false);
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleEditEvent = (event: IEvent) => {
    setSelectedEventForEdit(event);
    setIsEditScheduleModalOpen(true);
    setIsDetailModalOpen(false);
    // Reset edit form with selected event data
    editScheduleForm.reset({
      name: event.title,
      description: event.description || "",
      eventDate: dayjs(event.startDate).toDate(),
      shift:
        SHIFTS_OPTIONS.find((opt) => {
          const eventStartHour = dayjs(event.startDate).format("HH:mm");
          return opt.startTime === eventStartHour;
        })?.value || SHIFTS_OPTIONS[0].value,
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    Modal.confirm({
      title: "Xóa buổi học",
      content: "Bạn có chắc chắn muốn xóa buổi học này?",
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await deleteSchedule(eventId).unwrap();
          toast.success("Buổi học đã được xóa thành công");
          refetch();
          setIsDetailModalOpen(false);
        } catch (error) {
          // Error will be handled by middleware
        }
      },
    });
  };

  const canDeleteSchedule = useCallback((date: Date) => {
    // Can only delete schedules that are in the future
    return dayjs(date).isAfter(dayjs());
  }, []);

  const disabledDate = (current: Dayjs) => {
    // Disable dates outside class start and end date range
    if (!classStartDate || !classEndDate) return false;

    return (
      current.isBefore(classStartDate, "day") ||
      current.isAfter(classEndDate, "day")
    );
  };

  const handleUpdateSchedule = async (data: EditScheduleFormValues) => {
    try {
      if (!selectedEventForEdit) return;

      const selectedShift = SHIFTS_OPTIONS.find(
        (shift) => shift.value === data.shift,
      );

      if (!selectedShift) {
        toast.error("Ca học không hợp lệ.");
        return;
      }

      const eventDate = dayjs(data.eventDate);
      const [startHour, startMinute] = selectedShift.startTime.split(":");
      const scheduleStartDate = eventDate
        .hour(parseInt(startHour))
        .minute(parseInt(startMinute))
        .second(0)
        .millisecond(0);

      const [endHour, endMinute] = selectedShift.endTime.split(":");
      const scheduleEndDate = eventDate
        .hour(parseInt(endHour))
        .minute(parseInt(endMinute))
        .second(0)
        .millisecond(0);

      await updateSchedule({
        id: selectedEventForEdit.id,
        data: {
          name: data.name,
          description: data.description,
          startDate: scheduleStartDate.toDate(),
          endDate: scheduleEndDate.toDate(),
        },
      }).unwrap();

      toast.success("Buổi học đã được cập nhật thành công");
      setIsEditScheduleModalOpen(false);
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  if (isLoading || isLoadingClass) return <Loading />;

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Typography.Title level={4} className="mb-0">
            Thời khóa biểu
          </Typography.Title>
          <CustomButton
            type="primary"
            title="Thêm buổi học"
            icon={<PlusOutlined />}
            onClick={handleOpenAddSchedule}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {!hasTeacher && (
          <Alert
            message="Giáo viên bắt buộc"
            description="Vui lòng giáo viên cho lớp trước khi lập lịch. Không có giáo viên, lịch học không thể được quản lý chính xác."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        <AntdCalendar
          events={events}
          norms={norms}
          onOpenDetail={handleOpenDetail}
          onOpenCreate={handleOpenCreate}
          onRefetchAPI={handleRefetchAPI}
          loading={isLoading}
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

        {/* Event Detail Modal */}
        <Modal
          title={dayjs(selectedDate).format("MMMM D, YYYY")}
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          footer={[
            <CustomButton
              key="close"
              title="Close"
              onClick={() => setIsDetailModalOpen(false)}
            />,
          ]}
        >
          {selectedEvents.length ? (
            <div className="max-h-[60vh] overflow-y-auto">
              {selectedEvents.map((event) => (
                <Card key={event.id} className="mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                      {event.description && (
                        <div className="mt-2">
                          <Typography.Text type="secondary">
                            {event.description}
                          </Typography.Text>
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
                    <ScheduleActions
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      canDelete={canDeleteSchedule(event.startDate)}
                      isDeleting={isDeleting}
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Typography.Text type="secondary">
                Không có buổi học cho ngày này
              </Typography.Text>
            </div>
          )}
        </Modal>

        {/* Add Schedule Modal */}
        <Modal
          title={
            selectedCalendarDate
              ? `Thêm buổi học cho ${dayjs(selectedCalendarDate).format(
                  "MMMM D, YYYY",
                )}`
              : "Thêm lịch học"
          }
          open={isAddScheduleModalOpen}
          onCancel={() => setIsAddScheduleModalOpen(false)}
          width={800}
          footer={[
            <CustomButton
              key="cancel"
              title="Hủy bỏ"
              onClick={() => setIsAddScheduleModalOpen(false)}
            />,
            <CustomButton
              key="submit"
              type="primary"
              title="Lưu"
              onClick={scheduleForm.handleSubmit(handleAddSchedule)}
              loading={isCreatingSchedule}
            />,
          ]}
        >
          <div className="flex flex-col gap-4 py-4">
            {totalCourseHours > 0 && (
              <Alert
                message="Thông tin khóa học"
                description={
                  <div>
                    <div>Tổng số giờ khóa học: {totalCourseHours}h</div>
                    <div
                      className={
                        remainingHours <= 0 ? "text-red-500" : "text-blue-600"
                      }
                    >
                      Số giờ còn lại: {remainingHours.toFixed(1)}h
                    </div>
                  </div>
                }
                type="info"
                showIcon
                className="mb-4"
              />
            )}

            <CustomInput
              control={scheduleForm.control}
              name="name"
              label="Tên buổi học"
              placeholder="Nhập tên buổi học"
              required
            />

            <CustomTextArea
              control={scheduleForm.control}
              name="description"
              label="Mô tả"
              placeholder="Nhập mô tả buổi học"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomDatePicker
                control={scheduleForm.control}
                name="startDate"
                label="Ngày bắt đầu"
                placeholder="Chọn ngày bắt đầu"
                disabledDate={disabledDate}
                required
              />

              <CustomDatePicker
                control={scheduleForm.control}
                name="endDate"
                label="Ngày kết thúc"
                placeholder="Chọn ngày kết thúc"
                disabledDate={disabledDate}
                required
              />
            </div>

            <CustomSelect
              control={scheduleForm.control}
              name="shift"
              label="Ca học"
              placeholder="Chọn ca học"
              options={SHIFTS_OPTIONS.map((shift) => ({
                label: shift.label,
                value: shift.value,
              }))}
              required
            />

            <div>
              <CustomCheckboxGroup
                control={scheduleForm.control}
                name="weekdays"
                label="Ngày trong tuần"
                className="mr-2"
                options={WEEKDAY_OPTIONS}
                required
              />
            </div>

            {estimatedData.scheduleCount > 0 && (
              <Alert
                message="Schedule Summary"
                description={
                  <div>
                    <div>Số buổi học: {estimatedData.scheduleCount}</div>
                    <div>Số giờ buổi học: {HOURS_PER_SESSION}h</div>
                    <div>
                      Tổng số giờ dự kiến:{" "}
                      {estimatedData.estimatedHours.toFixed(1)}h
                    </div>
                    {totalCourseHours > 0 && (
                      <>
                        <div
                          className={
                            estimatedData.estimatedHours > remainingHours
                              ? "font-medium text-red-500"
                              : "text-green-600"
                          }
                        >
                          Số giờ còn lại sau khi tạo:{" "}
                          {(
                            remainingHours - estimatedData.estimatedHours
                          ).toFixed(1)}
                          h
                        </div>
                        {estimatedData.estimatedHours > remainingHours && (
                          <div className="mt-1 font-medium text-red-500">
                            ⚠️ Cảnh báo: Điều này sẽ vượt quá số giờ còn lại!
                          </div>
                        )}
                      </>
                    )}
                  </div>
                }
                type={
                  estimatedData.estimatedHours > remainingHours &&
                  totalCourseHours > 0
                    ? "warning"
                    : "info"
                }
                showIcon
              />
            )}
          </div>
        </Modal>

        {/* Edit Schedule Modal */}
        <Modal
          title="Cập nhật buổi học"
          open={isEditScheduleModalOpen}
          onCancel={() => setIsEditScheduleModalOpen(false)}
          width={800}
          footer={[
            <CustomButton
              key="cancel"
              title="Hủy bỏ"
              onClick={() => setIsEditScheduleModalOpen(false)}
            />,
            <CustomButton
              key="submit"
              type="primary"
              title="Lưu"
              onClick={editScheduleForm.handleSubmit(handleUpdateSchedule)}
              loading={isUpdatingSchedule}
            />,
          ]}
        >
          {selectedEventForEdit && (
            <div className="flex flex-col gap-4 py-4">
              <CustomInput
                control={editScheduleForm.control}
                name="name"
                label="Tên buổi học"
                placeholder="Nhập tên buổi học"
                required
              />
              <CustomTextArea
                control={editScheduleForm.control}
                name="description"
                label="Mô tả"
                placeholder="Nhập mô tả buổi học"
              />
              <CustomDatePicker
                control={editScheduleForm.control}
                name="eventDate"
                label="Ngày"
                placeholder="Chọn ngày"
                disabledDate={disabledDate}
                required
              />
              <CustomSelect
                control={editScheduleForm.control}
                name="shift"
                label="Ca học"
                placeholder="Chọn ca học"
                options={SHIFTS_OPTIONS.map((shift) => ({
                  label: shift.label,
                  value: shift.value,
                }))}
                required
              />
            </div>
          )}
        </Modal>
      </div>
    </Card>
  );
};

export default ClassCalendar;
