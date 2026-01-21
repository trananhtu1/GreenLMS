import RouteGuard from "@web/components/RouteGuard";
import MainLayout from "@web/layouts/MainLayout";
import { AccessRole } from "@web/libs/common";

const LayoutTeacher = ({ children }: React.PropsWithChildren) => {
  return (
    <RouteGuard requiredAccess={AccessRole.TEACHER}>
      <MainLayout>{children}</MainLayout>
    </RouteGuard>
  );
};

export default LayoutTeacher;
