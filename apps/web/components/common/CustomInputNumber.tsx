import { InputNumber } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

interface CustomInputNumberProps {
  control: Control<any>;
  name: string;
  size?: SizeType;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
}

const CustomInputNumber = ({
  control,
  name,
  size = "large",
  placeholder,
  min,
  max,
  disabled,
  label,
  required,
  className,
}: CustomInputNumberProps) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <CustomLabel label={label} required={required} />}
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => {
          return (
            <>
              <InputNumber
                {...field}
                size={size}
                placeholder={placeholder}
                min={min}
                max={max}
                disabled={disabled}
                style={{ width: "100%" }}
              />
              {error?.message && (
                <p className="text-red-500">{error.message}</p>
              )}
            </>
          );
        }}
      />
    </div>
  );
};

export default CustomInputNumber;
