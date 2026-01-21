"use client";
import { ExclamationCircleFilled } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Drawer, Modal, Space, Typography } from "antd";
import CustomButton from "./CustomButton";

interface CustomDrawerProps {
  title: string;
  open: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
  children?: React.ReactNode;
  loading?: boolean;
}

const CustomDrawer = ({
  open,
  onCancel,
  title,
  onSubmit,
  children,
  loading,
}: CustomDrawerProps) => {
  const showCloseConfirm = () => {
    Modal.confirm({
      title: "Bạn có chắc chắn muốn hủy bỏ?",
      icon: <ExclamationCircleFilled />,
      okText: "Có",
      okType: "danger",
      cancelText: "Không",
      onOk() {
        onCancel?.();
      },
    });
  };

  return (
    <Drawer
      title={
        <Typography.Title level={4} className="mb-0">
          {title}
        </Typography.Title>
      }
      open={open}
      onClose={showCloseConfirm}
      size="large"
      extra={
        <Space>
          <CustomButton
            title="Hủy bỏ"
            onClick={showCloseConfirm}
            size="large"
          />
          <CustomButton
            title="Lưu"
            type="primary"
            onClick={onSubmit}
            loading={loading}
            disabled={loading}
            size="large"
          />
        </Space>
      }
    >
      {children}
    </Drawer>
  );
};

export default CustomDrawer;
