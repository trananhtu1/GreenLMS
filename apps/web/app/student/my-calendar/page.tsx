"use client";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import { useGetStudentSchedulesQuery } from "@web/libs/features/schedules/scheduleApi";
import { NAV_TITLE } from "@web/libs/nav";
import {
  SCHEDULE_TYPE_LABEL,
  SCHEDULE_TYPE_OPTIONS,
  SCHEDULE_TYPE_TAG,
} from "@web/libs/schedule";
import { Card, Modal, Tag, Typography } from "antd";
import AntdCalendar from "antd-calendar";
import { EventType } from "antd-calendar/dist/constants";
import { IEvent } from "antd-calendar/dist/types";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.MY_STUDENT_CALENDAR,
  },
];

// Define validation schemas
const searchFormSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
});

// Define types based on the schemas
type SearchFormValues = z.infer<typeof searchFormSchema>;

const MyCalendar = () => {
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

  const { data: schedules, isFetching: isFetchingSchedules } =
    useGetStudentSchedulesQuery({
      ...searchParams,
      ...dateRange,
    });

  // Update forms with zod resolver
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
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

  const handleOpenDetail = useCallback((date: Date, events: IEvent[]) => {
    // Set the selected date and events
    setSelectedDate(date);
    setSelectedEvents(events);
    // Open the detail modal
    setIsDetailModalOpen(true);
  }, []);

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
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MY_STUDENT_CALENDAR}>
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
            </div>
          </div>
        </Card>

        <Card>
          <AntdCalendar
            events={events}
            onOpenDetail={handleOpenDetail}
            onOpenCreate={() => {}}
            onRefetchAPI={handleRefetchAPI}
            loading={isFetchingSchedules}
            showWeeklyNorm={false}
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
                Không có sự kiện nào cho ngày này
              </Typography.Text>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

export default MyCalendar;
