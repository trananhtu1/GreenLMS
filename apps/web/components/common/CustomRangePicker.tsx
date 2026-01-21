import { DatePicker } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import { Dayjs } from "dayjs";
import { isEmpty } from "lodash";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

const { RangePicker } = DatePicker;

interface CustomRangePickerProps {
  control: Control<any>;
  name: string;
  size?: SizeType;
  placeholder?: [string, string];
  disabled?: boolean;
  label?: string;
  required?: boolean;
  format?: string;
  className?: string;
  disableDate?: (current: Dayjs) => boolean;
}

const CustomRangePicker = ({
  control,
  name,
  size = "large",
  placeholder = ["Start date", "End date"],
  disabled,
  label,
  required,
  format = "DD/MM/YYYY",
  className,
  disableDate,
}: CustomRangePickerProps) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <CustomLabel label={label} required={required} />}

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => {
          return (
            <>
              <RangePicker
                {...field}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
                format={format}
                style={{ width: "100%" }}
                value={[field.value?.[0], field.value?.[1]]}
                onChange={(dates) => {
                  field.onChange(dates);
                }}
                disabledDate={disableDate}
              />

              {!isEmpty(error) && (
                <p className="text-red-500">
                  {error?.[0]?.message || error?.message}
                </p>
              )}
            </>
          );
        }}
      />
    </div>
  );
};

export default CustomRangePicker;
