import { Tooltip, TooltipProps } from "antd";
import React from "react";

interface CustomTooltipProps extends Omit<TooltipProps, "title"> {
  title: string;
  maxLength?: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  title,
  maxLength = 80,
  children,
  ...props
}) => {
  const truncatedTitle =
    title && title.length > maxLength
      ? `${title.substring(0, maxLength)}...`
      : title;

  return (
    <Tooltip title={truncatedTitle} {...props}>
      {children}
    </Tooltip>
  );
};

export default CustomTooltip; 
