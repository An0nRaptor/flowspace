export const NotificationTypeEnum = {
  MENTION: "MENTION",
  ASSIGNED: "ASSIGNED",
  DUE_SOON: "DUE_SOON",
  OVERDUE: "OVERDUE",
} as const;

export type NotificationTypeEnumType = keyof typeof NotificationTypeEnum;
