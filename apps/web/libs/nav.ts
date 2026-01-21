export const NAV_LINK = {
  OPS: "/ops",
  TEACHER: "/teacher",
  STUDENT: "/student",
  MY_PROFILE: "/my-profile",
  MY_PROFILE_OVERVIEW: "/my-profile/overview",
  MY_PROFILE_SETTINGS: "/my-profile/settings",
  LOGIN: "/login",

  WEEKLY_NORM_REGISTRATION: "/teacher/weekly-norm-registration",
  MY_TEACHER_CALENDAR: "/teacher/my-calendar",
  MY_STUDENT_CALENDAR: "/student/my-calendar",
  TIME_OFF_REGISTRATION: "/teacher/time-off-registration",
  BUSY_SCHEDULE_REGISTRATION: "/teacher/busy-schedule-registration",

  MANAGE_USERS: "/ops/user",
  TEACHER_LIST: "/ops/user/teacher/list",
  STUDENT_LIST: "/ops/user/student/list",
  STAFF_LIST: "/ops/user/staff/list",
  MANAGER_LIST: "/ops/user/manager/list",
  MANAGE_ROOMS: "/ops/room/list",
  MANAGE_FIELDS: "/ops/field/list",
  MANAGE_DEPARTMENTS: "/ops/department/list",
  MANAGE_REQUESTS: "/ops/request",
  WEEKLY_NORM_LIST: "/ops/request/weekly-norm/list",
  TIME_OFF_LIST: "/ops/request/time-off/list",
  BUSY_SCHEDULE_LIST: "/ops/request/busy-schedule/list",
  MANAGE_CALENDAR: "/ops/calendar",
  MANAGE_COURSES: "/ops/course/list",
  MANAGE_CLASSES: "/ops/class/list",
  MANAGE_SUPPORT_TICKETS: "/ops/support-ticket/list",

  MY_TEACHER_CLASS: "/teacher/my-class",
  MY_TEACHER_CLASS_DETAIL_OVERVIEW: (id: string) =>
    `/teacher/my-class/${id}/overview`,
  MY_TEACHER_CLASS_DETAIL_CALENDAR: (id: string) =>
    `/teacher/my-class/${id}/calendar`,
  MY_TEACHER_CLASS_DETAIL_STUDENTS: (id: string) =>
    `/teacher/my-class/${id}/students`,

  MY_STUDENT_CLASS: "/student/my-class",
  MY_STUDENT_CLASS_DETAIL_OVERVIEW: (id: string) =>
    `/student/my-class/${id}/overview`,
  MY_STUDENT_CLASS_DETAIL_STUDENTS: (id: string) =>
    `/student/my-class/${id}/students`,

  MY_SUPPORT_TICKET: "/teacher/my-support-ticket",

  CLASS_DETAIL_OVERVIEW: (id: string) => `/ops/class/${id}/overview`,
  CLASS_DETAIL_SETTINGS: (id: string) => `/ops/class/${id}/settings`,
  CLASS_DETAIL_CALENDAR: (id: string) => `/ops/class/${id}/calendar`,
  CLASS_DETAIL_STUDENTS: (id: string) => `/ops/class/${id}/students`,

  MY_NOTIFICATION: "/my-notification",

  USER_DETAIL_OVERVIEW: (id: string) => `/ops/user/${id}/overview`,
  USER_DETAIL_SETTINGS: (id: string) => `/ops/user/${id}/settings`,
};

export const NAV_TITLE = {
  HOME: "Trang chủ",
  MANAGE_USERS: "Quản lý người dùng",
  TEACHER_LIST: "Quản lý giáo viên",
  STUDENT_LIST: "Quản lý học viên",
  STAFF_LIST: "Quản lý nhân viên",
  MANAGER_LIST: "Quản lý người quản lý",
  MANAGE_ROOMS: "Quản lý phòng học",
  MANAGE_FIELDS: "Quản lý loại chứng chỉ",
  MANAGE_DEPARTMENTS: "Quản lý phòng ban",
  MY_PROFILE: "Thông tin cá nhân",
  WEEKLY_NORM_REGISTRATION: "Đăng ký định mức công việc",
  MY_TEACHER_CALENDAR: "Thời khóa biểu",
  MY_STUDENT_CALENDAR: "Thời khóa biểu",
  TIME_OFF_REGISTRATION: "Đăng ký lịch nghỉ cố định",
  BUSY_SCHEDULE_REGISTRATION: "Đăng ký lịch bận",
  MANAGE_REQUESTS: "Quản lý yêu cầu",
  WEEKLY_NORM_LIST: "Quản lý định mức công việc",
  TIME_OFF_LIST: "Quản lý lịch nghỉ cố định",
  BUSY_SCHEDULE_LIST: "Quản lý lịch bận",
  MANAGE_CALENDAR: "Quản lý thời khóa biểu",
  MANAGE_COURSES: "Quản lý khoá học",
  MY_TEACHER_CLASS: "Lớp học được giao",
  MY_STUDENT_CLASS: "Lớp đã đăng ký",
  MY_ACTIVE_CLASS: "Lớp đang hoạt động",
  MANAGE_CLASSES: "Quản lý lớp học",
  CLASS_DETAIL: "Chi tiết lớp học",
  USER_DETAIL: "Chi tiết người dùng",
  MY_SUPPORT_TICKET: "Phiếu hỗ trợ",
  MANAGE_SUPPORT_TICKETS: "Quản lý phiếu hỗ trợ",
  QUICK_ACTIONS: "Thao tác nhanh",
};
