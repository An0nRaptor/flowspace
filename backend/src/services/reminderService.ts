import { config } from "../config/app-config";
import { sendMail } from "../config/mail-config";
import { NotificationTypeEnum } from "../enums/notification";
import { TaskStatusEnum } from "../enums/task";
import TaskModel, { TaskDocument } from "../models/Task";
// Registered here because the reminder queries populate them.
import "../models/User";
import "../models/Project";
import { formatDueDate } from "../utils/format";
import { createNotificationService } from "./notificationService";

const DAY = 24 * 60 * 60 * 1000;

type ReminderTask = TaskDocument & {
  assignedTo: { _id: string; name: string; email: string } | null;
  project: { _id: string; name: string; emoji: string } | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sendReminder = async (task: ReminderTask, overdue: boolean) => {
  if (!task.assignedTo || !task.dueDate) return;

  const due = formatDueDate(task.dueDate);
  const message = overdue
    ? `"${task.title}" is overdue (was due ${due})`
    : `"${task.title}" is due ${due}`;

  await createNotificationService({
    userId: String(task.assignedTo._id),
    type: overdue
      ? NotificationTypeEnum.OVERDUE
      : NotificationTypeEnum.DUE_SOON,
    message,
    workspaceId: String(task.workspace),
    projectId: task.project ? String(task.project._id) : null,
    taskId: String(task._id),
  });

  const link = task.project
    ? `${config.FRONTEND_ORIGIN}/workspace/${task.workspace}/project/${task.project._id}`
    : `${config.FRONTEND_ORIGIN}/workspace/${task.workspace}/tasks`;
  const projectName = task.project
    ? `${task.project.emoji} ${task.project.name}`
    : "";

  await sendMail({
    to: task.assignedTo.email,
    subject: overdue ? `Overdue: ${task.title}` : `Due soon: ${task.title}`,
    text: `Hi ${task.assignedTo.name || "there"},\n\n${message}.\n${
      projectName ? `Project: ${projectName}\n` : ""
    }\nOpen it in FlowSpace: ${link}`,
    html: `<p>Hi ${escapeHtml(task.assignedTo.name || "there")},</p>
<p><strong>${escapeHtml(task.title)}</strong> ${
      overdue ? `is overdue (was due ${due})` : `is due ${due}`
    }.</p>
${projectName ? `<p>Project: ${escapeHtml(projectName)}</p>` : ""}
<p><a href="${link}">Open it in FlowSpace</a></p>`,
  });
};

export const runDueDateRemindersService = async () => {
  const now = Date.now();
  const baseQuery = {
    status: { $ne: TaskStatusEnum.DONE },
    assignedTo: { $ne: null },
  };

  // Due dates are stored as the start of the day, so a task is overdue
  // once its whole due day has passed.
  const overdueTasks = (await TaskModel.find({
    ...baseQuery,
    overdueReminderSent: { $ne: true },
    dueDate: { $lte: new Date(now - DAY) },
  })
    .populate("assignedTo", "_id name email")
    .populate("project", "_id name emoji")) as unknown as ReminderTask[];

  for (const task of overdueTasks) {
    await sendReminder(task, true);
    await TaskModel.updateOne(
      { _id: task._id },
      { overdueReminderSent: true, dueSoonReminderSent: true }
    );
  }

  const dueSoonTasks = (await TaskModel.find({
    ...baseQuery,
    dueSoonReminderSent: { $ne: true },
    dueDate: { $gt: new Date(now - DAY), $lte: new Date(now + DAY) },
  })
    .populate("assignedTo", "_id name email")
    .populate("project", "_id name emoji")) as unknown as ReminderTask[];

  for (const task of dueSoonTasks) {
    await sendReminder(task, false);
    await TaskModel.updateOne({ _id: task._id }, { dueSoonReminderSent: true });
  }

  return { overdue: overdueTasks.length, dueSoon: dueSoonTasks.length };
};

let isRunning = false;

export const startReminderScheduler = () => {
  const minutes = Math.max(1, Number(config.REMINDER_INTERVAL_MINUTES) || 15);

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const result = await runDueDateRemindersService();
      if (result.overdue || result.dueSoon) {
        console.log(
          `[reminders] Sent ${result.dueSoon} due-soon and ${result.overdue} overdue reminders`
        );
      }
    } catch (error) {
      console.error("[reminders] Failed to run", error);
    } finally {
      isRunning = false;
    }
  };

  setTimeout(run, 10 * 1000);
  setInterval(run, minutes * 60 * 1000);
};
