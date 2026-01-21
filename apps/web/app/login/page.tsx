"use client";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "@web/components/common/CustomButton";
import CustomInput from "@web/components/common/CustomInput";
import { useLoginMutation } from "@web/libs/features/auth/authApi";
import { Card, Typography } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

interface FormValues {
  email?: string;
  password?: string;
}

const Login = () => {
  const validationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
  });

  const [login, { isLoading }] = useLoginMutation();

  const router = useRouter();

  const onSubmit = async ({ email, password }: FormValues) => {
    try {
      const result = await login({ email, password }).unwrap();
      toast.success(result.message);
      router.push("/");
    } catch (error) {
      // Handled by the apiErrorMiddleware
    }
  };

  return (
    <main className="flex h-screen items-center justify-center relative">
      <Image
        src="/background-login.png"
        alt="Background"
        fill
        priority
        className="-z-10 object-cover"
      />
      <div className="flex flex-col items-center space-y-4 pb-20">
        <Image src="/logo.png" alt="Logo" width={400} height={100} priority />
        <Card>
          <div className="flex w-[500px] flex-col gap-6">
            <div className="text-center">
              <Typography.Title level={2} className="mb-2">
                Đăng nhập
              </Typography.Title>
              <Typography.Paragraph>
                Đăng nhập để tiếp tục học tập
              </Typography.Paragraph>
            </div>
            <CustomInput
              control={control}
              name="email"
              size="large"
              prefix={<UserOutlined className="mr-2" />}
              placeholder="Nhập email của bạn"
            />
            <CustomInput
              control={control}
              name="password"
              size="large"
              prefix={<LockOutlined className="mr-2" />}
              placeholder="Nhập mật khẩu của bạn"
              type="password"
            />
            <CustomButton
              type="primary"
              title="Đăng nhập"
              size="large"
              onClick={handleSubmit(onSubmit)}
              loading={isLoading}
            />
          </div>
        </Card>
      </div>
    </main>
  );
};

export default Login;
