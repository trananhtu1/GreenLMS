import { TimePicker } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import dayjs from "dayjs";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

interface CustomTimePickerProps {
  control: Control<any>;
  name: string;
  size?: SizeType;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  format?: string;
  className?: string;
}

const CustomTimePicker = ({
  control,
  name,
  size = "large",
  placeholder,
  disabled,
  label,
  required,
  format = "HH:mm",
  className,
}: CustomTimePickerProps) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <CustomLabel label={label} required={required} />}

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => {
          return (
            <>
              <TimePicker
                {...field}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
                format={format}
                style={{ width: "100%" }}
                onChange={(time) => field.onChange(time ?? null)}
                value={field.value ? dayjs(field.value) : null}
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

export default CustomTimePicker;
