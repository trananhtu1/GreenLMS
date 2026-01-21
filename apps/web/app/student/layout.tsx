import RouteGuard from "@web/components/RouteGuard";
import MainLayout from "@web/layouts/MainLayout";
import { AccessRole } from "@web/libs/common";

const LayoutStudent = ({ children }: React.PropsWithChildren) => {
  return (
    <RouteGuard requiredAccess={AccessRole.STUDENT}>
      <MainLayout>{children}</MainLayout>
    </RouteGuard>
  );
};

export default LayoutStudent;
