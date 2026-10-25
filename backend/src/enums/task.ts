export const TaskStatusEnum={
    BACKLOG : "BACKLOG",
    TODO: "TODO",
    IN_PROGRESS: "IN-PROGRESS",
    IN_REVIEW: "IN-REVIEW",
    DONE: "DONE"
} as const


export const TaskPriorityEnum = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH"
} as const 

export type TaskStatusEnumType = keyof typeof TaskStatusEnum;
export type TaskPriorityEnumType = keyof typeof TaskPriorityEnum;