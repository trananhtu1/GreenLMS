"use client";
import {
  DeleteOutlined,
  LockOutlined,
  PlusOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomDrawer from "@web/components/common/CustomDrawer";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomSelect from "@web/components/common/CustomSelect";
import Loading from "@web/components/common/Loading";
import { useDebouncedSelect } from "@web/hooks/useDebouncedSelect";
import { TableColumn } from "@web/libs/common";
import {
  useAddStudentToClassMutation,
  useGetAvailableStudentsQuery,
  useGetClassStudentsQuery,
  useRemoveStudentFromClassMutation,
  useUpdateStudentStatusMutation,
} from "@web/libs/features/classes/classApi";
import { IStudentClass } from "@web/libs/student-class";
import { IUser, STATUS_LABEL, STATUS_TAG, UserStatus } from "@web/libs/user";
import { Button, Card, Modal, Table, Tag, Typography } from "antd";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// Define validation schemas
const searchFormSchema = z.object({
  search: z.string().optional(),
});

const addStudentFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
});

// Define types based on the schemas
type SearchFormValues = z.infer<typeof searchFormSchema>;
type AddStudentFormValues = z.infer<typeof addStudentFormSchema>;

const columnsTitles: TableColumn<IStudentClass>[] = [
  {
    title: "STT",
    dataIndex: "index",
    render: (_, __, index) => index + 1,
  },
  {
    title: "Mã học viên",
    dataIndex: "student",
    render: (student: IUser) => student.detail.code,
  },
  {
    title: "Ảnh đại diện",
    dataIndex: "student",
    render: (student: IUser) =>
      student.avatar ? (
        <img
          src={student.avatar}
          alt={student.fullName}
          width={40}
          height={40}
          className="rounded-full"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          {student.fullName.charAt(0).toUpperCase()}
        </div>
      ),
  },
  {
    title: "Họ và tên",
    dataIndex: "student",
    render: (student: IUser) => student.fullName,
  },
  {
    title: "Email",
    dataIndex: "student",
    render: (student: IUser) => student.email,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: (status: UserStatus) => (
      <Tag color={STATUS_TAG[status]}>{STATUS_LABEL[status]}</Tag>
    ),
  },
  {
    title: "",
    key: "actions",
    dataIndex: "method",
  },
];

const StudentActions = ({
  record,
  onRemove,
  onToggleStatus,
}: {
  record: IUser;
  onRemove: (id: string) => void;
  onToggleStatus: (id: string, status: UserStatus) => void;
}) => {
  return (
    <CustomDropdown>
      {record.status === UserStatus.ACTIVE ? (
        <CustomButton
          type="link"
          icon={<LockOutlined />}
          onClick={() => onToggleStatus(record.id, UserStatus.BLOCKED)}
          title="Khóa"
        />
      ) : (
        <CustomButton
          type="link"
          icon={<UnlockOutlined />}
          onClick={() => onToggleStatus(record.id, UserStatus.ACTIVE)}
          title="Mở khóa"
        />
      )}
      <CustomButton
        type="link"
        title="Xóa"
        color="danger"
        icon={<DeleteOutlined />}
        onClick={() => onRemove(record.id)}
      />
    </CustomDropdown>
  );
};

const ClassStudents = () => {
  const { id: classId } = useParams<{ id: string }>();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);
  const [studentToToggleStatus, setStudentToToggleStatus] = useState<{
    status: UserStatus;
    studentClassId: string;
  } | null>(null);

  const {
    data: studentsData,
    isLoading,
    refetch,
  } = useGetClassStudentsQuery(
    {
      classId,
    },
    {
      skip: !classId,
    },
  );

  const addStudentForm = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
  });

  // Use debounced select for available students
  const {
    selectProps: { options: availableStudentOptions, onFocus, onPopupScroll },
  } = useDebouncedSelect({
    control: addStudentForm.control,
    name: "studentId",
    useGetDataQuery: useGetAvailableStudentsQuery,
    labelField: "fullName",
    queryArgs: {
      classId,
    },
  });

  const [addStudent, { isLoading: isAddingStudent }] =
    useAddStudentToClassMutation();
  const [removeStudent, { isLoading: isRemovingStudent }] =
    useRemoveStudentFromClassMutation();
  const [updateStudentStatus, { isLoading: isUpdatingStatus }] =
    useUpdateStudentStatusMutation();

  // Map the columns with actions
  const tableColumns = columnsTitles.map((item, index) => {
    if (item.dataIndex === "method") {
      return {
        ...item,
        key: index,
        render: (_, record) => (
          <StudentActions
            record={record}
            onRemove={setStudentToRemove}
            onToggleStatus={(studentClassId, status) =>
              setStudentToToggleStatus({ studentClassId, status })
            }
          />
        ),
      };
    }
    return {
      ...item,
      key: index,
    };
  });

  const handleOpenAddDrawer = () => {
    addStudentForm.reset();
    setIsAddDrawerOpen(true);
  };

  const handleCloseAddDrawer = () => {
    setIsAddDrawerOpen(false);
  };

  const handleAddStudent = async (data: AddStudentFormValues) => {
    try {
      await addStudent({
        classId,
        studentId: data.studentId,
      }).unwrap();
      toast.success("Học viên đã được thêm thành công");
      setIsAddDrawerOpen(false);
      refetch();
    } catch (error) {
      toast.error("Không thể thêm học viên");
    }
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;

    try {
      await removeStudent({
        classId,
        studentId: studentToRemove,
      }).unwrap();
      toast.success("Học viên đã được xóa thành công");
      setStudentToRemove(null);
      refetch();
    } catch (error) {
      toast.error("Không thể xóa học viên");
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!studentToToggleStatus) return;

    try {
      await updateStudentStatus({
        studentClassId: studentToToggleStatus.studentClassId,
        status: studentToToggleStatus.status,
      }).unwrap();

      const statusText =
        studentToToggleStatus.status === UserStatus.ACTIVE
          ? "unblocked"
          : "blocked";

      toast.success(`Học viên ${statusText} thành công`);
      setStudentToToggleStatus(null);
      refetch();
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái học viên");
    }
  };

  if (isLoading && !studentsData) return <Loading />;

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Typography.Title level={4} className="mb-0">
            Danh sách học viên
          </Typography.Title>
          <CustomButton
            type="primary"
            title="Thêm học viên"
            icon={<PlusOutlined />}
            onClick={handleOpenAddDrawer}
          />
        </div>
      }
    >
      <Table
        dataSource={studentsData?.data || []}
        columns={tableColumns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      {/* Add Student Drawer */}
      <CustomDrawer
        title="Thêm học viên"
        open={isAddDrawerOpen}
        onCancel={handleCloseAddDrawer}
        onSubmit={addStudentForm.handleSubmit(handleAddStudent)}
        loading={isAddingStudent}
      >
        <div className="flex flex-col gap-4">
          <CustomSelect
            control={addStudentForm.control}
            name="studentId"
            label="Học viên"
            placeholder="Chọn học viên"
            options={availableStudentOptions}
            onFocus={onFocus}
            onPopupScroll={onPopupScroll}
            required
          />
        </div>
      </CustomDrawer>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        title="Xóa học viên"
        content="Bạn có chắc chắn muốn xóa học viên này khỏi lớp học?"
        open={!!studentToRemove}
        onCancel={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        confirmLoading={isRemovingStudent}
      />

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        title={`${studentToToggleStatus?.status === UserStatus.ACTIVE ? "Mở khóa" : "Khóa"} học viên`}
        content={`Bạn có chắc chắn muốn ${studentToToggleStatus?.status === UserStatus.ACTIVE ? "mở khóa" : "khóa"} học viên này?`}
        open={!!studentToToggleStatus}
        onCancel={() => setStudentToToggleStatus(null)}
        onConfirm={handleConfirmToggleStatus}
        confirmLoading={isUpdatingStatus}
      />
    </Card>
  );
};

interface ConfirmModalProps {
  title: string;
  content: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLoading?: boolean;
}

const ConfirmModal = ({
  title,
  content,
  open,
  onCancel,
  onConfirm,
  confirmLoading = false,
}: ConfirmModalProps) => {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          loading={confirmLoading}
          onClick={onConfirm}
        >
          Xác nhận
        </Button>,
      ]}
    >
      <p>{content}</p>
    </Modal>
  );
};

export default ClassStudents;
