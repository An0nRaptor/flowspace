import mongoose, {Document, Schema} from "mongoose";
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnum, TaskStatusEnumType } from "../enums/task";
import { generateTaskCode } from "../utils/uuid";

export interface ChecklistItemDocument extends Document{
    text: string,
    completed: boolean
}

export interface AttachmentDocument extends Document{
    fileId: mongoose.Types.ObjectId,
    name: string,
    size: number,
    mimeType: string,
    uploadedBy: mongoose.Types.ObjectId,
    createdAt: Date
}

const checklistItemSchema = new Schema<ChecklistItemDocument>({
    text:{
        type: String,
        required: true,
        trim: true
    },
    completed:{
        type: Boolean,
        default: false
    }
})

const attachmentSchema = new Schema<AttachmentDocument>({
    fileId:{
        type: Schema.Types.ObjectId,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    size:{
        type: Number,
        required: true
    },
    mimeType:{
        type: String,
        required: true
    },
    uploadedBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},{
    timestamps:true
})


export interface TaskDocument extends Document{
    taskCode: string,
    title: string,
    description: string,
    project: mongoose.Types.ObjectId,
    workspace: mongoose.Types.ObjectId,
    status: TaskStatusEnumType,
    priority: TaskPriorityEnumType ,
    assignedTo: mongoose.Types.ObjectId | null,
    createdBy: mongoose.Types.ObjectId,
    dueDate: Date | null,
    labels: mongoose.Types.ObjectId[],
    checklist: mongoose.Types.DocumentArray<ChecklistItemDocument>,
    attachments: mongoose.Types.DocumentArray<AttachmentDocument>,
    dueSoonReminderSent: boolean,
    overdueReminderSent: boolean,
    createdAt: Date,
    updatedAt: Date

}


const taskSchema = new Schema<TaskDocument>({

    taskCode:{
        type: String,
        unique: true,
        default: generateTaskCode,
    },
    title:{
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String,
        trim: true,
        default: null
    },
    project:{
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    workspace:{
        type:Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },
    status:{
        type: String,
        enum : Object.values(TaskStatusEnum),
        default: TaskStatusEnum.TODO,
    },
    priority:{
        type: String,
        enum:Object.values(TaskPriorityEnum),
        default:TaskPriorityEnum.MEDIUM
    },
    assignedTo:{
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    dueDate:{
        type: Date,
        default: null
    },
    labels:[{
        type: Schema.Types.ObjectId,
        ref: "Label"
    }],
    checklist:[checklistItemSchema],
    attachments:[attachmentSchema],
    dueSoonReminderSent:{
        type: Boolean,
        default: false
    },
    overdueReminderSent:{
        type: Boolean,
        default: false
    }
},{
    timestamps:true
})

const TaskModel = mongoose.model<TaskDocument>("Task",taskSchema)

export default TaskModel