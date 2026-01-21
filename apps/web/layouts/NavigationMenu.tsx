import {
  AppstoreOutlined,
  BankOutlined,
  BookOutlined,
  BuildOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  ScheduleOutlined,
  SolutionOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { AccessRole, MenuItem, NavigationItem } from "@web/libs/common";
import { NAV_LINK, NAV_TITLE } from "@web/libs/nav";
import {
  canAccessOPS,
  canAccessStudent,
  canAccessTeacher,
} from "@web/libs/permissions";
import { RoleName } from "@web/libs/role";
import { RootState } from "@web/libs/store";
import { Menu } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";
import { useSelector } from "react-redux";

const OPSNavigationItems: NavigationItem[] = [
  {
    key: NAV_LINK.OPS,
    icon: <HomeOutlined />,
    label: NAV_TITLE.HOME,
    url: NAV_LINK.OPS,
  },
  {
    key: NAV_LINK.MY_PROFILE,
    icon: <ProfileOutlined />,
    label: NAV_TITLE.MY_PROFILE,
    url: NAV_LINK.MY_PROFILE,
  },
  {
    key: NAV_LINK.MANAGE_CALENDAR,
    icon: <CalendarOutlined />,
    label: NAV_TITLE.MANAGE_CALENDAR,
    url: NAV_LINK.MANAGE_CALENDAR,
    roles: [RoleName.ADMIN, RoleName.MANAGE, RoleName.RECEPTIONIST],
  },
  {
    key: NAV_LINK.MANAGE_COURSES,
    icon: <BookOutlined />,
    label: NAV_TITLE.MANAGE_COURSES,
    url: NAV_LINK.MANAGE_COURSES,
    roles: [RoleName.ADMIN, RoleName.STAFF_ACADEMIC],
  },
  {
    key: NAV_LINK.MANAGE_CLASSES,
    icon: <AppstoreOutlined />,
    label: NAV_TITLE.MANAGE_CLASSES,
    url: NAV_LINK.MANAGE_CLASSES,
    roles: [RoleName.ADMIN, RoleName.STAFF_ACADEMIC],
  },
  {
    key: NAV_LINK.MANAGE_ROOMS,
    icon: <BuildOutlined />,
    label: NAV_TITLE.MANAGE_ROOMS,
    url: NAV_LINK.MANAGE_ROOMS,
    roles: [RoleName.ADMIN, RoleName.STAFF_GENERAL],
  },
  {
    key: NAV_LINK.MANAGE_FIELDS,
    icon: <TrophyOutlined />,
    label: NAV_TITLE.MANAGE_FIELDS,
    url: NAV_LINK.MANAGE_FIELDS,
    roles: [RoleName.ADMIN, RoleName.STAFF_GENERAL],
  },
  {
    key: NAV_LINK.MANAGE_DEPARTMENTS,
    icon: <BankOutlined />,
    label: NAV_TITLE.MANAGE_DEPARTMENTS,
    url: NAV_LINK.MANAGE_DEPARTMENTS,
    roles: [RoleName.ADMIN, RoleName.STAFF_GENERAL],
  },
  {
    key: NAV_LINK.MANAGE_USERS,
    icon: <TeamOutlined />,
    label: NAV_TITLE.MANAGE_USERS,
    roles: [RoleName.ADMIN, RoleName.STAFF_GENERAL],
    children: [
      {
        label: NAV_TITLE.TEACHER_LIST,
        url: NAV_LINK.TEACHER_LIST,
        roles: [RoleName.ADMIN, RoleName.MANAGE, RoleName.STAFF_GENERAL],
      },
      {
        label: NAV_TITLE.STUDENT_LIST,
        url: NAV_LINK.STUDENT_LIST,
        roles: [RoleName.ADMIN, RoleName.MANAGE, RoleName.STAFF_GENERAL],
      },
      {
        label: NAV_TITLE.MANAGER_LIST,
        url: NAV_LINK.MANAGER_LIST,
        roles: [RoleName.ADMIN, RoleName.STAFF_GENERAL],
      },
      {
        label: NAV_TITLE.STAFF_LIST,
        url: NAV_LINK.STAFF_LIST,
        roles: [RoleName.ADMIN, RoleName.STAFF_GENERAL],
      },
    ],
  },

  {
    key: NAV_LINK.MANAGE_REQUESTS,
    icon: <FormOutlined />,
    label: NAV_TITLE.MANAGE_REQUESTS,
    roles: [RoleName.ADMIN, RoleName.MANAGE],
    children: [
      {
        key: NAV_LINK.WEEKLY_NORM_LIST,
        label: NAV_TITLE.WEEKLY_NORM_LIST,
        url: NAV_LINK.WEEKLY_NORM_LIST,
        roles: [RoleName.ADMIN, RoleName.MANAGE],
      },
      {
        key: NAV_LINK.TIME_OFF_LIST,
        label: NAV_TITLE.TIME_OFF_LIST,
        url: NAV_LINK.TIME_OFF_LIST,
        roles: [RoleName.ADMIN, RoleName.MANAGE],
      },
      {
        key: NAV_LINK.BUSY_SCHEDULE_LIST,
        label: NAV_TITLE.BUSY_SCHEDULE_LIST,
        url: NAV_LINK.BUSY_SCHEDULE_LIST,
        roles: [RoleName.ADMIN, RoleName.MANAGE],
      },
    ],
  },
  {
    key: NAV_LINK.MANAGE_SUPPORT_TICKETS,
    icon: <QuestionCircleOutlined />,
    label: NAV_TITLE.MANAGE_SUPPORT_TICKETS,
    url: NAV_LINK.MANAGE_SUPPORT_TICKETS,
    roles: [RoleName.ADMIN, RoleName.RECEPTIONIST],
  },
];

const TeacherNavigationItems: NavigationItem[] = [
  {
    key: NAV_LINK.TEACHER,
    icon: <HomeOutlined />,
    label: NAV_TITLE.HOME,
    url: NAV_LINK.TEACHER,
  },
  {
    key: NAV_LINK.MY_PROFILE,
    icon: <UserOutlined />,
    label: NAV_TITLE.MY_PROFILE,
    url: NAV_LINK.MY_PROFILE,
  },
  {
    key: NAV_LINK.MY_TEACHER_CALENDAR,
    icon: <CalendarOutlined />,
    label: NAV_TITLE.MY_TEACHER_CALENDAR,
    url: NAV_LINK.MY_TEACHER_CALENDAR,
  },
  {
    key: NAV_LINK.MY_TEACHER_CLASS,
    icon: <BookOutlined />,
    label: NAV_TITLE.MY_TEACHER_CLASS,
    url: NAV_LINK.MY_TEACHER_CLASS,
  },
  {
    key: NAV_LINK.BUSY_SCHEDULE_REGISTRATION,
    icon: <ScheduleOutlined />,
    label: NAV_TITLE.BUSY_SCHEDULE_REGISTRATION,
    url: NAV_LINK.BUSY_SCHEDULE_REGISTRATION,
  },
  {
    key: NAV_LINK.WEEKLY_NORM_REGISTRATION,
    icon: <SolutionOutlined />,
    label: NAV_TITLE.WEEKLY_NORM_REGISTRATION,
    url: NAV_LINK.WEEKLY_NORM_REGISTRATION,
  },
  {
    key: NAV_LINK.TIME_OFF_REGISTRATION,
    icon: <FileTextOutlined />,
    label: NAV_TITLE.TIME_OFF_REGISTRATION,
    url: NAV_LINK.TIME_OFF_REGISTRATION,
    roles: [RoleName.TEACHER_PART_TIME],
  },
  {
    key: NAV_LINK.MY_SUPPORT_TICKET,
    icon: <QuestionCircleOutlined />,
    label: NAV_TITLE.MY_SUPPORT_TICKET,
    url: NAV_LINK.MY_SUPPORT_TICKET,
  },
];

const StudentNavigationItems: NavigationItem[] = [
  {
    key: NAV_LINK.STUDENT,
    icon: <HomeOutlined />,
    label: NAV_TITLE.HOME,
    url: NAV_LINK.STUDENT,
  },
  {
    key: NAV_LINK.MY_PROFILE,
    icon: <UserOutlined />,
    label: NAV_TITLE.MY_PROFILE,
    url: NAV_LINK.MY_PROFILE,
  },
  {
    key: NAV_LINK.MY_STUDENT_CALENDAR,
    icon: <CalendarOutlined />,
    label: NAV_TITLE.MY_STUDENT_CALENDAR,
    url: NAV_LINK.MY_STUDENT_CALENDAR,
  },
  {
    key: NAV_LINK.MY_STUDENT_CLASS,
    icon: <BookOutlined />,
    label: NAV_TITLE.MY_STUDENT_CLASS,
    url: NAV_LINK.MY_STUDENT_CLASS,
  },
];

const transformToMenuItems = (
  items: NavigationItem[] | undefined,
  role: RoleName,
): MenuItem[] | undefined => {
  if (!items) return undefined;

  return items.map((item) => {
    if (item.roles && !item?.roles?.includes(role)) return undefined;

    const labelNode = item.url ? (
      <Link href={item.url}>{item.label}</Link>
    ) : (
      item.label
    );

    return {
      key: item.key ?? item.url,
      icon: item.icon,
      label: labelNode,
      children: items ? transformToMenuItems(item.children, role) : undefined,
    } as MenuItem;
  });
};

const NavigationMenu = () => {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);

  const menuItems = useMemo(() => {
    if (!user) return [];

    // First determine which kind of menu to show based on user role
    let userMenuType: AccessRole | null = null;
    if (canAccessOPS(user)) {
      userMenuType = AccessRole.OPS;
    } else if (canAccessTeacher(user)) {
      userMenuType = AccessRole.TEACHER;
    } else if (canAccessStudent(user)) {
      userMenuType = AccessRole.STUDENT;
    }

    // Return early if user has no valid menu type
    if (!userMenuType) return [];

    // Now check the current path
    const inMyProfileSection = pathname?.startsWith(NAV_LINK.MY_PROFILE);
    const inTeacherSection = pathname?.startsWith(NAV_LINK.TEACHER);
    const inOPSSection = pathname?.startsWith(NAV_LINK.OPS);
    const inStudentSection = pathname?.startsWith(NAV_LINK.STUDENT);

    // For My Profile, show menu based on user's role type
    if (inMyProfileSection) {
      if (userMenuType === AccessRole.OPS)
        return transformToMenuItems(OPSNavigationItems, user.role.roleName);
      if (userMenuType === AccessRole.TEACHER)
        return transformToMenuItems(TeacherNavigationItems, user.role.roleName);
      return transformToMenuItems(StudentNavigationItems, user.role.roleName);
    }

    if (inTeacherSection && canAccessTeacher(user)) {
      return transformToMenuItems(TeacherNavigationItems, user.role.roleName);
    }

    if (inOPSSection && canAccessOPS(user)) {
      return transformToMenuItems(OPSNavigationItems, user.role.roleName);
    }

    if (inStudentSection && canAccessStudent(user)) {
      return transformToMenuItems(StudentNavigationItems, user.role.roleName);
    }

    return [];
  }, [pathname, user]);

  const openKeys = useMemo(() => {
    if (!pathname) return [];

    const pathSegments = pathname.split("/").filter(Boolean);
    const openKeys: string[] = [];

    let currentPath = "";
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      openKeys.push(currentPath);
    }
    return openKeys;
  }, [pathname]);

  return (
    <Menu
      theme="dark"
      mode="inline"
      items={menuItems}
      defaultSelectedKeys={[pathname]}
      defaultOpenKeys={openKeys}
    />
  );
};

export default memo(NavigationMenu);
