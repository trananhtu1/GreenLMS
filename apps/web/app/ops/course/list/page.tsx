"use client";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomDrawer from "@web/components/common/CustomDrawer";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomInput from "@web/components/common/CustomInput";
import CustomSelect from "@web/components/common/CustomSelect";
import CustomTextArea from "@web/components/common/CustomTextArea";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import { TableColumn } from "@web/libs/common";
import { CourseType, CreateCourseDto, ICourse } from "@web/libs/course";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
  useLazyGetCourseByIdQuery,
  useUpdateCourseMutation,
} from "@web/libs/features/courses/courseApi";
import {
  closeCreateModal,
  openCreateModal,
} from "@web/libs/features/table/tableSlice";
import { NAV_TITLE } from "@web/libs/nav";
import { RootState } from "@web/libs/store";
import {
  STATUS_LABEL,
  STATUS_TAG,
  StatusOptions,
  UserStatus,
} from "@web/libs/user";
import { Card, Modal, Table, TablePaginationConfig, Tag } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.MANAGE_COURSES,
  },
];

const columnsTitles: TableColumn<ICourse>[] = [
  {
    title: "STT",
    dataIndex: "index",
  },
  {
    title: "Mã khóa học",
    dataIndex: "code",
  },
  {
    title: "Tên khóa học",
    dataIndex: "name",
  },
  {
    title: "Mô tả",
    dataIndex: "description",
  },
  {
    title: "Loại khóa học",
    dataIndex: "type",
  },
  {
    title: "Số giờ",
    dataIndex: "hours",
    render: (hours: number) => (hours ? `${hours} giờ` : ""),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: (status: UserStatus) => (
      <Tag color={STATUS_TAG[status]}>{STATUS_LABEL[status]}</Tag>
    ),
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
  },
  {
    title: "Ngày cập nhật",
    dataIndex: "updatedAt",
    render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
  },
  {
    title: "",
    dataIndex: "method",
    fixed: "right",
  },
];

// Define Zod schema for course form validation
const courseFormSchema = z.object({
  name: z.string().min(1, "Tên khóa học là bắt buộc"),
  description: z.string().optional(),
  type: z.nativeEnum(CourseType, {
    required_error: "Loại khóa học là bắt buộc",
  }),
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]).optional(),
  hours: z
    .number()
    .min(0, "Số giờ phải là số dương")
    .optional()
    .or(z.string().transform((val) => (val === "" ? undefined : Number(val)))),
});

// Create type from Zod schema
type CourseFormValues = z.infer<typeof courseFormSchema>;

const courseTypeOptions = Object.entries(CourseType).map(([label, value]) => ({
  label,
  value,
}));

const CourseActions = ({
  record,
  onEdit,
  onDelete,
}: {
  record: ICourse;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <CustomDropdown>
      <CustomButton
        type="link"
        title="Cập nhật"
        icon={<EditOutlined />}
        onClick={() => onEdit(record.id)}
      />
      <CustomButton
        type="link"
        title="Xóa"
        color="danger"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(record.id)}
      />
    </CustomDropdown>
  );
};

// Add search form schema
const searchFormSchema = z.object({
  name: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const Courses = () => {
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    defaultCurrent: 1,
    defaultPageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
  });
  const [searchParams, setSearchParams] = useState<{
    name?: string;
    page?: number;
    limit?: number;
  }>({
    page: 1,
    limit: 10,
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { isOpenCreateModal } = useSelector((state: RootState) => state.table);
  const dispatch = useDispatch();

  // Search form
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  // Course form with validation
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      status: UserStatus.ACTIVE,
    },
  });

  const { data, isFetching, refetch } = useGetCoursesQuery(searchParams);
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

  // Use the lazy version of the query
  const [getCourseById, { isFetching: isLoadingCourse }] =
    useLazyGetCourseByIdQuery();

  const { current, pageSize } = pagination;

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          render: (record: ICourse) => {
            return (
              <CourseActions
                record={record}
                onEdit={handleEditCourse}
                onDelete={handleDeleteCourse}
              />
            );
          },
          key: index,
        };
      }
      if (item.dataIndex === "name") {
        return {
          ...item,
          render: (name: string, record: ICourse) => (
            <CustomTooltip title={name}>
              <span
                className="cursor-pointer text-blue-500 hover:text-blue-700"
                onClick={() => handleEditCourse(record.id)}
              >
                {name}
              </span>
            </CustomTooltip>
          ),
          key: index,
        };
      }
      return {
        ...item,
        key: index,
      };
    });
  }, []);

  const tableData = useMemo(() => {
    return (
      data?.data?.items.map((item, index) => ({
        ...item,
        index: ((current || 1) - 1) * (pageSize || 10) + index + 1,
        method: item,
      })) || []
    );
  }, [data, current, pageSize]);

  const onSubmitSearch = (formData: { name?: string }) => {
    setSearchParams({
      ...searchParams,
      name: formData.name,
      page: 1, // Reset to first page on new search
    });
    setPagination({
      ...pagination,
      current: 1,
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

  const handleEditCourse = (id: string) => {
    setSelectedCourseId(id);
    setIsEditMode(true);

    // Use the lazy query to get course data
    getCourseById(id)
      .unwrap()
      .then((response) => {
        if (response?.data) {
          const course = response.data;
          courseForm.reset({
            name: course.name,
            description: course.description,
            type: course.type,
            status: course.status,
            hours: course.hours,
          });
          dispatch(openCreateModal());
        }
      })
      .catch((error) => {
        // Error handling
      });
  };

  const handleDeleteCourse = (id: string) => {
    Modal.confirm({
      title: "Xóa khóa học",
      content: "Bạn có chắc chắn muốn xóa khóa học này?",
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await deleteCourse(id).unwrap();
          toast.success("Khóa học đã được xóa thành công");
          refetch();
        } catch (error) {
          // Handled by the apiErrorMiddleware
        }
      },
    });
  };

  const onSubmitCourse = async (formData: CourseFormValues) => {
    try {
      // Convert formData to match the CreateCourseDto structure
      const courseData: CreateCourseDto = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        hours: formData.hours,
      };

      if (isEditMode && selectedCourseId) {
        await updateCourse({ id: selectedCourseId, data: courseData }).unwrap();
        toast.success("Khóa học đã được cập nhật thành công");
      } else {
        await createCourse(courseData).unwrap();
        toast.success("Khóa học đã được tạo thành công");
      }
      handleCloseDrawer();
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCloseDrawer = () => {
    dispatch(closeCreateModal());
    courseForm.reset();
    setIsEditMode(false);
    setSelectedCourseId(null);
  };

  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
    setSearchParams({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleAddCourse = () => {
    setIsEditMode(false);
    courseForm.reset({
      name: "",
      description: "",
      type: undefined,
      status: UserStatus.ACTIVE,
      hours: undefined,
    });
    dispatch(openCreateModal());
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MANAGE_COURSES}>
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="name"
                size="large"
                placeholder="Tìm kiếm theo tên khóa học"
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
                title="Thêm khóa học"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleAddCourse}
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

      <CustomDrawer
        title={isEditMode ? "Cập nhật khóa học" : "Thêm khóa học"}
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={courseForm.handleSubmit(onSubmitCourse)}
        loading={isCreating || isUpdating || isLoadingCourse}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={courseForm.control}
            name="name"
            label="Tên khóa học"
            placeholder="Nhập tên khóa học"
            required
          />

          <CustomSelect
            control={courseForm.control}
            name="type"
            label="Loại khóa học"
            placeholder="Chọn loại khóa học"
            options={courseTypeOptions}
            required
          />

          <CustomInput
            control={courseForm.control}
            name="hours"
            label="Số giờ"
            placeholder="Nhập số giờ khóa học"
            type="number"
          />

          <CustomTextArea
            control={courseForm.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả khóa học"
          />

          <CustomSelect
            control={courseForm.control}
            name="status"
            label="Trạng thái"
            placeholder="Chọn trạng thái"
            options={StatusOptions}
          />
        </div>
      </CustomDrawer>
    </PageLayout>
  );
};

export default Courses;
