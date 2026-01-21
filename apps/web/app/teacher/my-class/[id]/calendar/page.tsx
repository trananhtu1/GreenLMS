"use client";
import "@ant-design/v5-patch-for-react-19";
import CustomButton from "@web/components/common/CustomButton";
import Loading from "@web/components/common/Loading";
import { useGetClassSchedulesQuery } from "@web/libs/features/classes/classApi";
import { SCHEDULE_TYPE_LABEL, SCHEDULE_TYPE_TAG } from "@web/libs/schedule";
import { Card, Modal, Tag, Typography } from "antd";
import AntdCalendar from "antd-calendar";
import { EventType } from "antd-calendar/dist/constants";
import { IEvent } from "antd-calendar/dist/types";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

const ClassCalendar = () => {
  const { id: classId } = useParams<{ id: string }>();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<IEvent[]>([]);

  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf("month").startOf("week").toISOString(),
    endDate: dayjs().endOf("month").endOf("week").toISOString(),
  });

  const { data: scheduleData, isLoading } = useGetClassSchedulesQuery(
    {
      classId,
      ...dateRange,
    },
    {
      skip: !classId,
    },
  );

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

  if (isLoading) return <Loading />;

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Typography.Title level={4} className="mb-0">
            Thời khóa biểu
          </Typography.Title>
        </div>
      }
    >
      <AntdCalendar
        events={events}
        onOpenDetail={handleOpenDetail}
        onOpenCreate={() => {}}
        onRefetchAPI={handleRefetchAPI}
        loading={isLoading}
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
                  <div className="flex-1">
                    <Typography.Title level={5}>{event.title}</Typography.Title>
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
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <Typography.Text type="secondary">
              Không có buổi học nào cho ngày này
            </Typography.Text>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ClassCalendar;
