export const ALL_CATEGORY = { id: "__all__" } as const;

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
}
