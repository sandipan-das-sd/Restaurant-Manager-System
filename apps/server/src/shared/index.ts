export const APP_NAME = "Restaurant Manager System";
export const DEMO_PASSWORD = "Dhabar@123";

export const ROLE_KEYS = [
  "super_admin",
  "owner",
  "manager",
  "cashier",
  "kitchen",
  "purchase",
  "viewer",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export const PERMISSION_KEYS = [
  "dashboard.view",
  "sales.view",
  "kitchen.view",
  "purchases.view",
  "reports.view",
  "roles.view",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type RoleDef = {
  key: RoleKey;
  name: string;
  description: string;
  accent: string;
  sortOrder: number;
  permissions: PermissionKey[];
};

export const ROLES: RoleDef[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full access. This is the login used to review the desk.",
    accent: "#c4522a",
    sortOrder: 1,
    permissions: [...PERMISSION_KEYS],
  },
  {
    key: "owner",
    name: "Owner",
    description: "Outlet owner. Costs, settings, and approvals stay with this role.",
    accent: "#1f6b45",
    sortOrder: 2,
    permissions: [...PERMISSION_KEYS],
  },
  {
    key: "manager",
    name: "Manager",
    description: "Runs the day's purchases, stock, and close.",
    accent: "#8a5a12",
    sortOrder: 3,
    permissions: ["dashboard.view", "sales.view", "kitchen.view", "purchases.view", "reports.view"],
  },
  {
    key: "cashier",
    name: "Cashier",
    description: "Bills and collections. Profit stays closed.",
    accent: "#9a3412",
    sortOrder: 4,
    permissions: ["dashboard.view", "sales.view"],
  },
  {
    key: "kitchen",
    name: "Kitchen staff",
    description: "Preparation and stock. No sales money on this desk.",
    accent: "#3f6212",
    sortOrder: 5,
    permissions: ["dashboard.view", "kitchen.view"],
  },
  {
    key: "purchase",
    name: "Purchase staff",
    description: "Suppliers and receipts. No profit on this desk.",
    accent: "#1e4d6b",
    sortOrder: 6,
    permissions: ["dashboard.view", "purchases.view"],
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "Read only. This role cannot change records.",
    accent: "#57534e",
    sortOrder: 7,
    permissions: ["dashboard.view", "reports.view"],
  },
];

export const FEATURES = [
  {
    key: "sales",
    permission: "sales.view",
    title: "Sales desk",
    summary: "Bills and collections for this shift.",
  },
  {
    key: "kitchen",
    permission: "kitchen.view",
    title: "Kitchen",
    summary: "Preparation queue for the outlet.",
  },
  {
    key: "purchases",
    permission: "purchases.view",
    title: "Purchases",
    summary: "Supplier receipts for the day.",
  },
  {
    key: "reports",
    permission: "reports.view",
    title: "Reports",
    summary: "Read-only numbers for the day.",
  },
  {
    key: "roles",
    permission: "roles.view",
    title: "Roles",
    summary: "Which role can open which desk.",
  },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

export type DemoAccount = {
  role: RoleKey;
  name: string;
  email: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "super_admin", name: "Awanish Rai", email: "superadmin@dhabar.local" },
  { role: "owner", name: "Awanish Rai", email: "owner@dhabar.local" },
  { role: "manager", name: "Meera Shah", email: "manager@dhabar.local" },
  { role: "cashier", name: "Rohan Das", email: "cashier@dhabar.local" },
  { role: "kitchen", name: "Imran Qureshi", email: "kitchen@dhabar.local" },
  { role: "purchase", name: "Neha Kapoor", email: "purchase@dhabar.local" },
  { role: "viewer", name: "Kabir Sen", email: "viewer@dhabar.local" },
];

export function roleByKey(key: RoleKey): RoleDef {
  const role = ROLES.find((item) => item.key === key);
  if (!role) {
    throw new Error(`Unknown role ${key}`);
  }
  return role;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  outletName: string;
  role: {
    key: RoleKey;
    name: string;
    description: string;
    accent: string;
  };
  permissions: PermissionKey[];
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type DashboardFeature = {
  key: FeatureKey;
  title: string;
  summary: string;
  allowed: boolean;
};

export type DashboardResponse = {
  welcome: string;
  personName: string;
  roleName: string;
  roleKey: RoleKey;
  roleDescription: string;
  accent: string;
  features: DashboardFeature[];
};

export type FeatureDetail = {
  key: FeatureKey;
  title: string;
  message: string;
  summary: string;
};

export type RoleListResponse = {
  roles: Array<{
    key: RoleKey;
    name: string;
    description: string;
  }>;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  field_errors: Record<string, string>;
  request_id: string;
};
