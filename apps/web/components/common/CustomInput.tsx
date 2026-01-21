import { Input } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

interface CustomInputProps {
  control: Control<any>;
  name: string;
  size?: SizeType;
  prefix?: React.ReactNode;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
}

const CustomInput = ({
  control,
  name,
  size = "large",
  prefix,
  placeholder,
  type,
  disabled,
  label,
  required,
  autoComplete,
  defaultValue,
}: CustomInputProps) => {
  return (
    <div className="w-full">
      {label && <CustomLabel label={label} required={required} />}

      <Controller
        control={control}
        name={name}
        defaultValue={defaultValue}
        render={({ field, fieldState: { error } }) => {
          return (
            <>
              {type === "password" ? (
                <Input.Password
                  {...field}
                  size={size}
                  prefix={prefix}
                  placeholder={placeholder}
                  disabled={disabled}
                  autoComplete={autoComplete}
                />
              ) : (
                <Input
                  {...field}
                  size={size}
                  prefix={prefix}
                  placeholder={placeholder}
                  disabled={disabled}
                  autoComplete={autoComplete}
                />
              )}
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

export default CustomInput;
