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
import CustomInputNumber from "@web/components/common/CustomInputNumber";
import CustomTextArea from "@web/components/common/CustomTextArea";
import CustomTooltip from "@web/components/common/CustomTooltip";
import FilterGrid from "@web/components/common/FilterGrid";
import PageLayout from "@web/layouts/PageLayout";
import { TableColumn } from "@web/libs/common";
import {
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useGetRoomsQuery,
  useLazyGetRoomByIdQuery,
  useUpdateRoomMutation,
} from "@web/libs/features/rooms/roomApi";
import {
  closeCreateModal,
  openCreateModal,
} from "@web/libs/features/table/tableSlice";
import { NAV_TITLE } from "@web/libs/nav";
import { CreateRoomDto, IRoom } from "@web/libs/room";
import { RootState } from "@web/libs/store";
import { STATUS_LABEL, UserStatus } from "@web/libs/user";
import { Card, Modal, Table, TablePaginationConfig } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

const breadcrumbs: ItemType[] = [
  {
    title: NAV_TITLE.MANAGE_ROOMS,
  },
];

const columnsTitles: TableColumn<IRoom>[] = [
  {
    title: "STT",
    dataIndex: "index",
  },
  {
    title: "Mã phòng",
    dataIndex: "code",
  },
  {
    title: "Tên phòng",
    dataIndex: "name",
  },
  {
    title: "Số lượng",
    dataIndex: "quantity",
  },
  {
    title: "Vị trí",
    dataIndex: "location",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: (status: UserStatus) => STATUS_LABEL[status],
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

// Define Zod schema for room form validation
const roomFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]).optional(),
});

// Create type from Zod schema and ensure it matches CreateRoomDto
type RoomFormValues = z.infer<typeof roomFormSchema>;

// Add search form schema
const searchFormSchema = z.object({
  name: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const RoomActions = ({
  record,
  onEdit,
  onDelete,
}: {
  record: IRoom;
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

const Rooms = () => {
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
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { isOpenCreateModal } = useSelector((state: RootState) => state.table);
  const dispatch = useDispatch();

  // Search form
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
  });

  // Room form with validation
  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      quantity: undefined,
      location: "",
      description: "",
      status: UserStatus.ACTIVE,
    },
  });

  const { data, isFetching, refetch } = useGetRoomsQuery(searchParams);
  const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: isUpdating }] = useUpdateRoomMutation();
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();

  // Use the lazy version of the query
  const [getRoomById, { isFetching: isLoadingRoom }] =
    useLazyGetRoomByIdQuery();

  const { current, pageSize } = pagination;

  const tableColumns = useMemo(() => {
    return columnsTitles.map((item, index) => {
      if (item.dataIndex === "method") {
        return {
          ...item,
          render: (record: IRoom) => {
            return (
              <RoomActions
                record={record}
                onEdit={handleEditRoom}
                onDelete={handleDeleteRoom}
              />
            );
          },
          key: index,
        };
      }
      if (item.dataIndex === "name") {
        return {
          ...item,
          render: (name: string, record: IRoom) => (
            <CustomTooltip title={name}>
              <span
                className="cursor-pointer text-blue-500 hover:text-blue-700"
                onClick={() => handleEditRoom(record.id)}
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
      page: 1, // Reset to first page on new name
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

  const handleEditRoom = (id: string) => {
    setSelectedRoomId(id);
    setIsEditMode(true);

    // Use the lazy query to get room data
    getRoomById(id)
      .unwrap()
      .then((response) => {
        if (response?.data) {
          const room = response.data;
          roomForm.reset({
            name: room.name,
            quantity: room.quantity,
            location: room.location,
            description: room.description,
            status: room.status,
          });
          dispatch(openCreateModal());
        }
      })
      .catch((error) => {
        // Error handling
      });
  };

  const handleDeleteRoom = (id: string) => {
    Modal.confirm({
      title: "Xóa phòng",
      content: "Bạn có chắc chắn muốn xóa phòng này?",
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await deleteRoom(id).unwrap();
          toast.success("Phòng đã được xóa thành công");
          refetch();
        } catch (error) {
          // Handled by the apiErrorMiddleware
        }
      },
    });
  };

  const onSubmitRoom = async (formData: RoomFormValues) => {
    try {
      // Convert formData to match the CreateRoomDto structure
      const roomData: CreateRoomDto = {
        name: formData.name,
        quantity: formData.quantity,
        location: formData.location,
        description: formData.description,
        status: formData.status,
      };

      if (isEditMode && selectedRoomId) {
        await updateRoom({ id: selectedRoomId, data: roomData }).unwrap();
        toast.success("Phòng đã được cập nhật thành công");
      } else {
        await createRoom(roomData).unwrap();
        toast.success("Phòng đã được tạo thành công");
      }
      handleCloseDrawer();
      refetch();
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  const handleCloseDrawer = () => {
    dispatch(closeCreateModal());
    roomForm.reset();
    setIsEditMode(false);
    setSelectedRoomId(null);
  };

  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
    setSearchParams({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleAddRoom = () => {
    setIsEditMode(false);
    roomForm.reset({
      name: "",
      quantity: undefined,
      location: "",
      description: "",
      status: UserStatus.ACTIVE,
    });
    dispatch(openCreateModal());
  };

  return (
    <PageLayout breadcrumbs={breadcrumbs} title={NAV_TITLE.MANAGE_ROOMS}>
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <FilterGrid>
              <CustomInput
                control={searchForm.control}
                name="name"
                size="large"
                placeholder="Tìm kiếm theo tên hoặc mã phòng"
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
                title="Thêm phòng"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleAddRoom}
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
        title={isEditMode ? "Cập nhật phòng" : "Thêm phòng"}
        open={isOpenCreateModal}
        onCancel={handleCloseDrawer}
        onSubmit={roomForm.handleSubmit(onSubmitRoom)}
        loading={isCreating || isUpdating || isLoadingRoom}
      >
        <div className="flex flex-col gap-4">
          <CustomInput
            control={roomForm.control}
            name="name"
            label="Tên phòng"
            placeholder="Nhập tên phòng"
            required
          />

          <CustomInputNumber
            control={roomForm.control}
            name="quantity"
            label="Số lượng"
            placeholder="Nhập số lượng phòng"
          />

          <CustomInput
            control={roomForm.control}
            name="location"
            label="Vị trí"
            placeholder="Nhập vị trí phòng"
          />

          <CustomTextArea
            control={roomForm.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả phòng"
          />
        </div>
      </CustomDrawer>
    </PageLayout>
  );
};

export default Rooms;
