import { Checkbox } from "antd";
import { CheckboxOptionType } from "antd/es/checkbox";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "./CustomLabel";

interface CustomCheckboxGroupProps {
  control: Control<any>;
  name: string;
  options: CheckboxOptionType[];
  disabled?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
}

const CustomCheckboxGroup = ({
  control,
  name,
  options,
  disabled,
  label,
  required,
  className,
}: CustomCheckboxGroupProps) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <CustomLabel label={label} required={required} />}

      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name={name}
          render={({ field, fieldState: { error } }) => {
            return (
              <>
                <Checkbox.Group
                  {...field}
                  options={options}
                  disabled={disabled}
                  onChange={(checkedValues) => field.onChange(checkedValues)}
                  value={field.value || []}
                />

                {error?.message && (
                  <p className="text-red-500">{error.message}</p>
                )}
              </>
            );
          }}
        />
      </div>
    </div>
  );
};

export default CustomCheckboxGroup;
