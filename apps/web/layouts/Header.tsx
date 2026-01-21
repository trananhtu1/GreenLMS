"use client";
import {
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import CustomDropdown from "@web/components/common/CustomDropdown";
import CustomPopover from "@web/components/common/CustomPopover";
import { logout } from "@web/libs/features/auth/authSlice";
import { toggleSidebar } from "@web/libs/features/layout/layoutSlice";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
} from "@web/libs/features/notifications/notificationApi";
import {
  addNotification,
  appendNotifications,
  markAllAsRead,
  setNotifications,
} from "@web/libs/features/notifications/notificationSlice";
import { NAV_LINK } from "@web/libs/nav";
import { Notification } from "@web/libs/notification";
import { RootState } from "@web/libs/store";
import {
  Avatar,
  Badge,
  Button,
  Layout,
  List,
  message,
  Spin,
  Typography,
} from "antd";
import clsx from "clsx";
import dayjs from "dayjs";
import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";

const { Text } = Typography;

const NotificationItem = ({ notification }: { notification: Notification }) => {
  return (
    <List.Item
      className={clsx("px-4 py-2", {
        "bg-gray-100": !notification.read,
      })}
    >
      <div className="flex w-full flex-col">
        <div className="text-sm font-semibold text-blue-700">
          {notification.title}
        </div>
        {notification.content && (
          <div className="mt-1 text-sm text-gray-600">
            {notification.content}
          </div>
        )}
        <Text type="secondary" className="mt-1 text-xs">
          {dayjs(notification.createdAt).format("DD/MM/YYYY HH:mm")}
        </Text>
      </div>
    </List.Item>
  );
};

const NotificationList = ({
  notifications,
  onLoadMore,
  hasMore,
  loading,
}: {
  notifications: Notification[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const [markNotificationsAsRead, { isLoading: markingAsRead }] =
    useMarkAllAsReadMutation();

  const handleMarkAllAsRead = async () => {
    // Get all unread notification IDs
    const unreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    try {
      await markNotificationsAsRead({
        notificationIds: unreadIds,
      }).unwrap();
      dispatch(markAllAsRead());
    } catch (error) {
      message.error("Failed to mark notifications as read");
    }
  };

  return (
    <div className="w-80">
      <div className="mb-2 flex items-center justify-between border-b pb-2">
        <h3 className="m-0">Thông báo</h3>
        {notifications.some((n) => !n.read) && (
          <Button
            type="link"
            size="small"
            onClick={handleMarkAllAsRead}
            loading={markingAsRead}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>
      <div ref={listRef} className="max-h-80 overflow-auto">
        <List
          dataSource={notifications}
          renderItem={(item) => <NotificationItem notification={item} />}
          locale={{ emptyText: "Không có thông báo" }}
          loading={false}
        />
        {loading && (
          <div className="py-2 text-center">
            <Spin size="small" />
          </div>
        )}
        {hasMore && !loading && (
          <div className="py-2 text-center">
            <Button type="link" onClick={onLoadMore} size="small">
              Show More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed } = useSelector((state: RootState) => state.layout);
  const { notifications, unreadCount } = useSelector(
    (state: RootState) => state.notification,
  );
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { data: notificationsData, isFetching } = useGetNotificationsQuery({
    page,
    limit: 10,
  });

  const items = [
    {
      key: "1",
      icon: <UserOutlined />,
      label: <Link href={NAV_LINK.MY_PROFILE}>Thông tin cá nhân</Link>,
    },
    {
      key: "2",
      icon: <LogoutOutlined />,
      label: (
        <Link href={NAV_LINK.LOGIN} onClick={() => dispatch(logout())}>
          Đăng xuất
        </Link>
      ),
      danger: true,
    },
  ];

  useEffect(() => {
    if (!notificationsData) return;

    if (page === 1) {
      dispatch(setNotifications(notificationsData.data.items));
    } else {
      dispatch(appendNotifications(notificationsData.data.items));
    }

    // Check if we've reached the end of the list using pagination data
    const { page: currentPage, total, limit } = notificationsData.data;
    setHasMore(currentPage * limit < total);
  }, [notificationsData, dispatch, page]);

  const loadMoreNotifications = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [isFetching, hasMore]);

  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io(process.env.NEXT_PUBLIC_API_URL_SOCKET); // Adjust port to match your socket service

    // Authenticate with user ID when connected
    socket.on("connect", () => {
      if (user?.id) {
        socket.emit("authenticate", user.id);
      }
    });

    // Listen for notifications
    socket.on("notification", (notification: Notification) => {
      dispatch(addNotification(notification));
      message.info({
        content: notification.content,
        duration: 3,
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [user, dispatch]);

  const userAvatar = (
    <a className="flex h-10 items-center justify-end gap-2 px-2">
      <span className="font-bold">{user?.fullName}</span>
      <Avatar
        icon={
          user?.avatar ? (
            <img
              src={user?.avatar}
              alt="Avatar"
              width={160}
              height={160}
              className="rounded-full"
            />
          ) : (
            <UserOutlined />
          )
        }
      />
    </a>
  );

  const bellIcon = (
    <Badge count={unreadCount}>
      <Button type="text" icon={<BellOutlined className="text-xl" />} />
    </Badge>
  );

  return (
    <Layout.Header className="flex items-center justify-between border-b border-solid border-gray-200 bg-white px-0 py-2 shadow">
      <Button
        type="text"
        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => dispatch(toggleSidebar())}
        className="h-12 w-12"
      />
      <div className="flex items-center gap-4 pr-4">
        <CustomPopover
          content={
            <NotificationList
              notifications={notifications}
              onLoadMore={loadMoreNotifications}
              hasMore={hasMore}
              loading={isFetching}
            />
          }
        >
          {bellIcon}
        </CustomPopover>

        <CustomDropdown items={items} icon={userAvatar} />
      </div>
    </Layout.Header>
  );
};

export default memo(Header);
