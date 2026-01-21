import { Popover, PopoverProps } from "antd";
import React from "react";

interface CustomPopoverProps {
  content?: React.ReactNode;
  title?: React.ReactNode;
  trigger?: ("click" | "hover" | "contextMenu")[];
  placement?: PopoverProps["placement"];
  overlayClassName?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CustomPopover = ({
  content,
  title,
  trigger = ["click"],
  placement = "bottomLeft",
  overlayClassName = "min-w-[150px]",
  children,
  open,
  onOpenChange,
}: CustomPopoverProps) => {
  return (
    <Popover
      content={content}
      title={title}
      trigger={trigger}
      placement={placement}
      overlayClassName={overlayClassName}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </Popover>
  );
};

export default CustomPopover;
