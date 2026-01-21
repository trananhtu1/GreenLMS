import { MoreOutlined } from "@ant-design/icons";
import { Placement } from "@web/libs/common";
import { Dropdown, MenuProps } from "antd";
import React from "react";

interface CustomDropdownProps {
  children?: React.ReactNode | React.ReactNode[];
  icon?: React.ReactNode;
  trigger?: ("click" | "hover" | "contextMenu")[];
  placement?: Placement;
  items?: MenuProps["items"];
}

const CustomDropdown = ({
  children,
  icon = <MoreOutlined />,
  trigger = ["click"],
  placement = "bottomLeft",
  items,
}: CustomDropdownProps) => {
  const menuItems =
    items ||
    React.Children.toArray(children).map((child, index) => ({
      key: index,
      label: child,
    }));

  return (
    <Dropdown
      menu={{
        items: menuItems,
      }}
      trigger={trigger}
      placement={placement}
      overlayClassName="min-w-[150px]"
    >
      <div className="cursor-pointer">{icon}</div>
    </Dropdown>
  );
};

export default CustomDropdown;
