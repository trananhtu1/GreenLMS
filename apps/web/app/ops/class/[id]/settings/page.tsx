"use client";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomDatePicker from "@web/components/common/CustomDatePicker";
import CustomInput from "@web/components/common/CustomInput";
import CustomInputNumber from "@web/components/common/CustomInputNumber";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTextArea from "@web/components/common/CustomTextArea";
import Loading from "@web/components/common/Loading";
import { useDebouncedSelect } from "@web/hooks/useDebouncedSelect";
import { UpdateClassDto } from "@web/libs/class";
import {
  useGetClassByIdQuery,
  useUpdateClassMutation,
} from "@web/libs/features/classes/classApi";
import { useGetRoomsQuery } from "@web/libs/features/rooms/roomApi";
import { useGetTeachersQuery } from "@web/libs/features/users/userApi";
import { StatusOptions, UserStatus } from "@web/libs/user";
import { Card, Typography } from "antd";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// Define Zod schema for class form validation
const classFormSchema = z.object({
  name: z.string().min(1, "Tên lớp là bắt buộc"),
  description: z.string().optional(),
  startDate: z.any().optional(),
  endDate: z.any().optional(),
  quantity: z.number().int().nonnegative().optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]).optional(),
  courseId: z.string().min(1, "Khóa học là bắt buộc"),
  teacherId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
});

// Create type from Zod schema
type ClassFormValues = z.infer<typeof classFormSchema>;

const ClassSettings = () => {
  const { id: classId } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: classData,
    isLoading,
    refetch,
  } = useGetClassByIdQuery(classId, {
    skip: !classId,
  });

  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();

  const classDetail = classData?.data;

  const courseOptions = classDetail?.course
    ? [
        {
          label: `${classDetail.course.code} - ${classDetail.course.name}`,
          value: classDetail.course.id,
        },
      ]
    : [];

  const teacherOptions = classDetail?.teacher
    ? [
        {
          label: `${classDetail.teacher.fullName}`,
          value: classDetail.teacher.id,
        },
      ]
    : [];

  const roomOptions = classDetail?.room
    ? [
        {
          label: `${classDetail.room.name}`,
          value: classDetail.room.id,
        },
      ]
    : [];

  const { control, handleSubmit, reset } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: null,
      endDate: null,
      quantity: 0,
      status: UserStatus.ACTIVE,
      courseId: undefined,
      teacherId: null,
      roomId: null,
    },
  });

  // Teacher select with debounce
  const { selectProps: teacherSelectProps } = useDebouncedSelect({
    name: "teacherId",
    control: control,
    useGetDataQuery: useGetTeachersQuery,
    labelField: "fullName",
    valueField: "id",
    initialOptions: teacherOptions,
  });

  // Room select with debounce
  const { selectProps: roomSelectProps } = useDebouncedSelect({
    name: "roomId",
    control: control,
    useGetDataQuery: useGetRoomsQuery,
    labelField: "name",
    valueField: "id",
    initialOptions: roomOptions,
  });

  useEffect(() => {
    if (!classDetail) return;

    reset({
      name: classDetail.name,
      description: classDetail.description || "",
      startDate: classDetail.startDate ? dayjs(classDetail.startDate) : null,
      endDate: classDetail.endDate ? dayjs(classDetail.endDate) : null,
      quantity: classDetail.quantity || 0,
      status: classDetail.status,
      courseId: classDetail.courseId,
      teacherId: classDetail.teacherId || null,
      roomId: classDetail.roomId || null,
    });
  }, [classDetail]);

  const onSubmit = async (formData: ClassFormValues) => {
    try {
      // Format dates to ISO string format if they exist
      const startDate = formData.startDate
        ? dayjs(formData.startDate).format("YYYY-MM-DD")
        : undefined;

      const endDate = formData.endDate
        ? dayjs(formData.endDate).format("YYYY-MM-DD")
        : undefined;

      const updateData: UpdateClassDto = {
        name: formData.name,
        description: formData.description,
        startDate,
        endDate,
        quantity: formData.quantity,
        status: formData.status,
        teacherId: formData.teacherId || undefined,
        roomId: formData.roomId || undefined,
      };

      await updateClass({ id: classId, data: updateData }).unwrap();
      toast.success("Lớp đã được cập nhật thành công");
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) return <Loading />;

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Typography.Title level={4} className="mb-0">
            Cập nhật thông tin
          </Typography.Title>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Mã lớp:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput
              control={control}
              name="code"
              size="large"
              disabled
              defaultValue={classDetail?.code}
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Tên lớp:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInput name="name" control={control} size="large" required />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Khóa học:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomSelect
              name="courseId"
              control={control}
              size="large"
              options={courseOptions}
              disabled
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Ngày bắt đầu:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomDatePicker name="startDate" control={control} size="large" />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Ngày kết thúc:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomDatePicker name="endDate" control={control} size="large" />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Số lượng tối đa:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomInputNumber name="quantity" control={control} size="large" />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Trạng thái:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomSelect
              name="status"
              control={control}
              size="large"
              options={StatusOptions}
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Giáo viên:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomSelect
              name="teacherId"
              control={control}
              size="large"
              placeholder="Chọn giáo viên"
              options={teacherSelectProps.options}
              onFocus={teacherSelectProps.onFocus}
              onPopupScroll={teacherSelectProps.onPopupScroll}
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/4">
            <Typography.Text strong>Phòng học:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomSelect
              name="roomId"
              control={control}
              size="large"
              placeholder="Chọn phòng học"
              options={roomSelectProps.options}
              onFocus={roomSelectProps.onFocus}
              onPopupScroll={roomSelectProps.onPopupScroll}
            />
          </div>
        </div>

        <div className="flex items-start">
          <div className="w-1/4">
            <Typography.Text strong>Mô tả:</Typography.Text>
          </div>
          <div className="w-3/4">
            <CustomTextArea name="description" control={control} rows={4} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <CustomButton
          title="Hủy bỏ"
          size="large"
          icon={<CloseOutlined />}
          onClick={handleCancel}
        />
        <CustomButton
          type="primary"
          title="Lưu"
          size="large"
          loading={isUpdating}
          disabled={isUpdating}
          icon={<SaveOutlined />}
          onClick={handleSubmit(onSubmit)}
        />
      </div>
    </Card>
  );
};

export default ClassSettings;
