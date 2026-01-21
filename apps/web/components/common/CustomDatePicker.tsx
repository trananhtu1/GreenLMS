import { DatePicker } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import dayjs from "dayjs";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

interface CustomDatePickerProps {
  control: Control<any>;
  name: string;
  size?: SizeType;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  format?: string;
  className?: string;
  disabledDate?: (current: dayjs.Dayjs) => boolean;
}

const CustomDatePicker = ({
  control,
  name,
  size = "large",
  placeholder,
  disabled,
  label,
  required,
  format = "DD/MM/YYYY",
  className,
  disabledDate,
}: CustomDatePickerProps) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <CustomLabel label={label} required={required} />}

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => {
          return (
            <>
              <DatePicker
                {...field}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
                format={format}
                style={{ width: "100%" }}
                onChange={(date) => field.onChange(date ?? null)}
                value={field.value ? dayjs(field.value) : null}
                disabledDate={disabledDate}
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

export default CustomDatePicker;
