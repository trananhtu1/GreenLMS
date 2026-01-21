import { SizeType } from "antd/es/config-provider/SizeContext";
import TextArea from "antd/es/input/TextArea";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

interface CustomInputProps {
  control: Control<any>;
  name: string;
  size?: SizeType;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  autoComplete?: string;
  rows?: number;
}

const CustomTextArea = ({
  control,
  name,
  size = "large",
  placeholder,
  disabled,
  label,
  required,
  autoComplete,
  rows,
}: CustomInputProps) => {
  return (
    <div className="w-full">
      {label && <CustomLabel label={label} required={required} />}

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => {
          return (
            <>
              <TextArea
                {...field}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                rows={rows}
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

export default CustomTextArea;
