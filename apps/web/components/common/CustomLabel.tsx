import { Typography } from "antd";
import clsx from "clsx";

interface CustomLabelProps {
  label: string;
  required?: boolean;
}

const CustomLabel = ({ label, required }: CustomLabelProps) => {
  return (
    <Typography.Text
      strong
      className={clsx("custom-label", {
        required,
      })}
    >
      {label}
    </Typography.Text>
  );
};

export default CustomLabel;
