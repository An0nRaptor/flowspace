import crypto from "crypto";
import mongoose from "mongoose";
import { Roles } from "../enums/role";
import { ActivityActionEnum } from "../enums/activity";
import { NotificationTypeEnum } from "../enums/notification";
import UserModel from "../models/User";
import AccountModel from "../models/Accounts";
import WorkspaceModel from "../models/Workspace";
import MemberModel from "../models/Member";
import RoleModel from "../models/RolesPermission";
import ProjectModel from "../models/Project";
import TaskModel, { TaskDocument } from "../models/Task";
import LabelModel from "../models/Label";
import CommentModel from "../models/Comment";
import ActivityModel from "../models/Activity";
import NotificationModel from "../models/Notification";
import { NotFoundException } from "../utils/appError";
import { registerUserService } from "./authService";
import { deleteAttachmentFilesService } from "./attachmentService";

const DEMO_LIFETIME_MS = 24 * 60 * 60 * 1000;

const randomId = () => crypto.randomBytes(6).toString("hex");

const createDemoUser = async (name: string) => {
  const email = `demo-${randomId()}@flowspace.demo`;
  const { userId, workspaceId } = await registerUserService({
    name,
    email,
    password: crypto.randomBytes(24).toString("hex"),
  });
  await UserModel.updateOne({ _id: userId }, { isDemo: true });
  return { userId: userId as mongoose.Types.ObjectId, workspaceId };
};

const dayFromToday = (offset: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

// Every visitor gets a private, pre-filled workspace with fake teammates.
export const createDemoAccountService = async () => {
  const owner = await createDemoUser("Demo User");
  const teammates = await Promise.all(
    ["Priya Sharma", "Alex Chen", "Sara Khan"].map(createDemoUser)
  );
  const [priya, alex, sara] = teammates;
  const ws = owner.workspaceId;

  const [adminRole, memberRole] = await Promise.all([
    RoleModel.findOne({ name: Roles.ADMIN }),
    RoleModel.findOne({ name: Roles.MEMBER }),
  ]);
  if (!adminRole || !memberRole) {
    throw new NotFoundException("Roles are missing. Run the role seeder.");
  }

  await WorkspaceModel.updateOne(
    { _id: ws },
    { name: "Acme Product Team", description: "Demo workspace" }
  );
  await MemberModel.insertMany([
    { userId: priya.userId, workspaceId: ws, role: adminRole._id },
    { userId: alex.userId, workspaceId: ws, role: memberRole._id },
    { userId: sara.userId, workspaceId: ws, role: memberRole._id },
  ]);

  const [website] = await ProjectModel.create([
    {
      emoji: "🚀",
      name: "Website Relaunch",
      description: "New marketing site and sign-up flow",
      workspace: ws,
      createdBy: owner.userId,
    },
    {
      emoji: "📱",
      name: "Mobile App",
      description: "iOS and Android app",
      workspace: ws,
      createdBy: priya.userId,
    },
    {
      emoji: "🎨",
      name: "Design System",
      description: "Shared components and tokens",
      workspace: ws,
      createdBy: priya.userId,
    },
  ]);

  const labelDocs = await LabelModel.insertMany(
    [
      ["Bug", "RED"],
      ["Feature", "BLUE"],
      ["Urgent", "ORANGE"],
      ["Design", "PURPLE"],
      ["Backend", "GREEN"],
    ].map(([name, color]) => ({
      name,
      color,
      workspace: ws,
      createdBy: owner.userId,
    }))
  );
  const label = (name: string) =>
    labelDocs.find((doc) => doc.name === name)!._id;

  const people = {
    you: owner.userId,
    priya: priya.userId,
    alex: alex.userId,
    sara: sara.userId,
  };

  const taskSeeds: {
    title: string;
    status: string;
    priority: string;
    who: keyof typeof people | null;
    due: number | null;
    labels: string[];
    checklist: [string, boolean][];
  }[] = [
    {
      title: "Write launch announcement",
      status: "BACKLOG",
      priority: "LOW",
      who: "sara",
      due: null,
      labels: [],
      checklist: [],
    },
    {
      title: "Plan A/B test for pricing page",
      status: "BACKLOG",
      priority: "MEDIUM",
      who: null,
      due: 12,
      labels: ["Feature"],
      checklist: [],
    },
    {
      title: "Hero section redesign",
      status: "TODO",
      priority: "HIGH",
      who: "priya",
      due: 3,
      labels: ["Design", "Feature"],
      checklist: [
        ["Wireframes", true],
        ["Hi-fi mockup", false],
        ["Review with team", false],
      ],
    },
    {
      title: "Set up analytics events",
      status: "TODO",
      priority: "MEDIUM",
      who: "alex",
      due: 5,
      labels: ["Backend"],
      checklist: [],
    },
    {
      title: "Fix login redirect loop",
      status: "IN_PROGRESS",
      priority: "HIGH",
      who: "you",
      due: 1,
      labels: ["Bug", "Urgent"],
      checklist: [
        ["Reproduce", true],
        ["Write fix", true],
        ["Add test", false],
      ],
    },
    {
      title: "Pricing page",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      who: "priya",
      due: 2,
      labels: ["Feature"],
      checklist: [
        ["Copy", true],
        ["Layout", true],
        ["Payment link", false],
        ["QA", false],
      ],
    },
    {
      title: "Sign-up form validation",
      status: "IN_REVIEW",
      priority: "MEDIUM",
      who: "you",
      due: 4,
      labels: ["Feature"],
      checklist: [
        ["Email", true],
        ["Password rules", true],
      ],
    },
    {
      title: "Image optimisation",
      status: "IN_REVIEW",
      priority: "LOW",
      who: "alex",
      due: 6,
      labels: ["Backend"],
      checklist: [],
    },
    {
      title: "Navbar dark mode",
      status: "DONE",
      priority: "LOW",
      who: "sara",
      due: -2,
      labels: ["Design"],
      checklist: [
        ["Tokens", true],
        ["Toggle", true],
      ],
    },
    {
      title: "SEO meta tags",
      status: "DONE",
      priority: "MEDIUM",
      who: "you",
      due: -1,
      labels: [],
      checklist: [],
    },
  ];

  const tasks: TaskDocument[] = [];
  for (const seed of taskSeeds) {
    // Saved one by one so each gets its own generated task code.
    const task = await TaskModel.create({
      title: seed.title,
      description: "",
      status: seed.status,
      priority: seed.priority,
      assignedTo: seed.who ? people[seed.who] : null,
      dueDate: seed.due === null ? null : dayFromToday(seed.due),
      labels: seed.labels.map(label),
      checklist: seed.checklist.map(([text, completed]) => ({
        text,
        completed,
      })),
      project: website._id,
      workspace: ws,
      createdBy: owner.userId,
      // The visitor shouldn't get reminder emails for sample tasks.
      dueSoonReminderSent: true,
      overdueReminderSent: true,
    });
    tasks.push(task);
  }

  const byTitle = (title: string) => tasks.find((t) => t.title === title)!;
  const loginBug = byTitle("Fix login redirect loop");
  const signUp = byTitle("Sign-up form validation");

  await CommentModel.create([
    {
      content:
        "@Demo User I can reproduce it on Safari only. Could you take a look?",
      task: loginBug._id,
      workspace: ws,
      author: alex.userId,
      mentions: [owner.userId],
    },
    {
      content: "Looks good to me. Ship it once the tests pass.",
      task: signUp._id,
      workspace: ws,
      author: priya.userId,
      mentions: [],
    },
  ]);

  const minutesAgo = (minutes: number) =>
    new Date(Date.now() - minutes * 60 * 1000);
  await ActivityModel.insertMany([
    {
      action: ActivityActionEnum.PROJECT_CREATED,
      message: "created project 🚀 Website Relaunch",
      workspace: ws,
      project: website._id,
      actor: owner.userId,
      createdAt: minutesAgo(180),
    },
    {
      action: ActivityActionEnum.TASK_ASSIGNED,
      message: `assigned "${loginBug.title}" to Demo User`,
      workspace: ws,
      project: website._id,
      task: loginBug._id,
      actor: priya.userId,
      createdAt: minutesAgo(95),
    },
    {
      action: ActivityActionEnum.TASK_MOVED,
      message: `moved "Navbar dark mode" from In Review to Done`,
      workspace: ws,
      project: website._id,
      task: byTitle("Navbar dark mode")._id,
      actor: sara.userId,
      createdAt: minutesAgo(60),
    },
    {
      action: ActivityActionEnum.CHECKLIST_COMPLETED,
      message: `completed "Layout" in "Pricing page"`,
      workspace: ws,
      project: website._id,
      task: byTitle("Pricing page")._id,
      actor: priya.userId,
      createdAt: minutesAgo(30),
    },
    {
      action: ActivityActionEnum.COMMENT_ADDED,
      message: `commented on "${loginBug.title}"`,
      workspace: ws,
      project: website._id,
      task: loginBug._id,
      actor: alex.userId,
      createdAt: minutesAgo(8),
    },
  ]);

  await NotificationModel.insertMany([
    {
      type: NotificationTypeEnum.ASSIGNED,
      message: `assigned you to "${loginBug.title}"`,
      user: owner.userId,
      actor: priya.userId,
      workspace: ws,
      project: website._id,
      task: loginBug._id,
      createdAt: minutesAgo(95),
    },
    {
      type: NotificationTypeEnum.MENTION,
      message: `mentioned you in "${loginBug.title}"`,
      user: owner.userId,
      actor: alex.userId,
      workspace: ws,
      project: website._id,
      task: loginBug._id,
      createdAt: minutesAgo(8),
    },
  ]);

  const user = await UserModel.findById(owner.userId);
  if (!user) {
    throw new NotFoundException("Demo user not found.");
  }
  return { user: user.omitPassword() };
};

// Removes demo accounts older than a day, with everything in their workspaces.
export const deleteExpiredDemoAccountsService = async () => {
  const users = await UserModel.find({
    isDemo: true,
    createdAt: { $lt: new Date(Date.now() - DEMO_LIFETIME_MS) },
  }).select("_id");
  if (users.length === 0) return 0;

  const userIds = users.map((user) => user._id);
  const workspaces = await WorkspaceModel.find({
    owner: { $in: userIds },
  }).select("_id");
  const wsIds = workspaces.map((workspace) => workspace._id);

  const tasks = await TaskModel.find({ workspace: { $in: wsIds } }).select(
    "attachments.fileId"
  );
  await deleteAttachmentFilesService(
    tasks.flatMap((task) => task.attachments.map((a) => a.fileId))
  );

  await Promise.all([
    TaskModel.deleteMany({ workspace: { $in: wsIds } }),
    ProjectModel.deleteMany({ workspace: { $in: wsIds } }),
    CommentModel.deleteMany({ workspace: { $in: wsIds } }),
    LabelModel.deleteMany({ workspace: { $in: wsIds } }),
    ActivityModel.deleteMany({ workspace: { $in: wsIds } }),
    NotificationModel.deleteMany({
      $or: [{ workspace: { $in: wsIds } }, { user: { $in: userIds } }],
    }),
    MemberModel.deleteMany({
      $or: [{ workspaceId: { $in: wsIds } }, { userId: { $in: userIds } }],
    }),
    AccountModel.deleteMany({ userId: { $in: userIds } }),
  ]);
  await WorkspaceModel.deleteMany({ _id: { $in: wsIds } });
  await UserModel.deleteMany({ _id: { $in: userIds } });

  return users.length;
};

export const startDemoCleanupScheduler = () => {
  const run = () =>
    deleteExpiredDemoAccountsService()
      .then((count) => {
        if (count) console.log(`[demo] Removed ${count} expired demo users`);
      })
      .catch((error) => console.error("[demo] Cleanup failed", error));

  setTimeout(run, 30 * 1000);
  setInterval(run, 60 * 60 * 1000);
};
