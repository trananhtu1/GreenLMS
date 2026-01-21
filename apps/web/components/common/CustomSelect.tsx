import { Select } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import { DefaultOptionType } from "antd/es/select";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

interface CustomSelectProps {
  control: Control<any>;
  name: string;
  size?: SizeType;
  prefix?: React.ReactNode;
  placeholder?: string;
  options: DefaultOptionType[];
  disabled?: boolean;
  defaultValue?: string;
  label?: string;
  required?: boolean;
  onFocus?: () => void;
  onPopupScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  loading?: boolean;
  showSearch?: boolean;
}

const CustomSelect = ({
  control,
  name,
  size = "large",
  prefix,
  placeholder,
  options,
  disabled,
  defaultValue,
  label,
  required,
  onFocus,
  onPopupScroll,
  loading,
  showSearch,
}: CustomSelectProps) => {
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
              <Select
                {...field}
                size={size}
                prefix={prefix}
                placeholder={placeholder}
                options={options}
                onChange={(value) => {
                  field.onChange(value);
                }}
                className="w-full"
                disabled={disabled}
                onFocus={onFocus}
                onPopupScroll={onPopupScroll}
                loading={loading}
                showSearch={showSearch}
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

export default CustomSelect;
