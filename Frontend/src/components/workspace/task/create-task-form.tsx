import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { CalendarIcon, Loader } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { getAvatarColor, getAvatarFallbackText, transformOptions } from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import useInvalidateTasks from "@/hooks/api/use-invalidate-tasks";
import { createTaskMutationFn, editTaskMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { TaskType } from "@/types/api.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UNASSIGNED = "unassigned";

export default function CreateTaskForm(props: {
  projectId?: string;
  task?: TaskType;
  onClose: () => void;
}) {
  const { projectId, task, onClose } = props;
  const isEdit = !!task;

  const workspaceId = useWorkspaceId();
  const invalidateTasks = useInvalidateTasks(workspaceId);

  const { mutate: createTask, isPending: isCreating } = useMutation({
    mutationFn: createTaskMutationFn,
  });
  const { mutate: editTask, isPending: isEditing } = useMutation({
    mutationFn: editTaskMutationFn,
  });
  const isPending = isCreating || isEditing;

  const { data, isLoading } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    pageNumber: 1,
    pageSize: 100,
    skip: !!projectId || isEdit,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projectOptions =
    data?.projects?.map((project) => ({
      label: (
        <div className="flex items-center gap-1">
          <span>{project.emoji}</span>
          <span>{project.name}</span>
        </div>
      ),
      value: project._id,
    })) || [];

  // Workspace Memebers
  const membersOptions =
    memberData?.members?.map((member) => {
      const name = member.userId?.name || "Unknown";
      const initials = getAvatarFallbackText(name);
      const avatarColor = getAvatarColor(name);
      return {
        label: (
          <div className="flex items-center space-x-2">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={member.userId?.profilePicture || ""}
                alt={name}
              />
              <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
            </Avatar>
            <span>{name}</span>
          </div>
        ),
        value: member.userId._id,
      };
    }) || [];

  const formSchema = z.object({
    title: z.string().trim().min(1, {
      message: "Title is required",
    }),
    description: z.string().trim(),
    projectId: z.string().trim().min(1, {
      message: "Project is required",
    }),
    status: z.enum(
      Object.values(TaskStatusEnum) as [keyof typeof TaskStatusEnum],
      {
        required_error: "Status is required",
      }
    ),
    priority: z.enum(
      Object.values(TaskPriorityEnum) as [keyof typeof TaskPriorityEnum],
      {
        required_error: "Priority is required",
      }
    ),
    assignedTo: z.string().trim(),
    dueDate: z.date().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      projectId: task?.project?._id || projectId || "",
      status: task?.status || TaskStatusEnum.TODO,
      priority: task?.priority || TaskPriorityEnum.MEDIUM,
      assignedTo: task?.assignedTo?._id || UNASSIGNED,
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
    },
  });

  const taskStatusList = Object.values(TaskStatusEnum);
  const taskPriorityList = Object.values(TaskPriorityEnum);

  const statusOptions = transformOptions(taskStatusList);
  const priorityOptions = transformOptions(taskPriorityList);

  const onSuccess = (message: string) => {
    invalidateTasks();
    toast({
      title: "Success",
      description: message,
      variant: "success",
    });
    onClose();
  };

  const onError = (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    const data = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      status: values.status,
      assignedTo: values.assignedTo === UNASSIGNED ? null : values.assignedTo,
      dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
    };

    if (task) {
      editTask(
        {
          taskId: task._id,
          projectId: values.projectId,
          workspaceId,
          data,
        },
        { onSuccess: (res) => onSuccess(res.message), onError }
      );
      return;
    }

    createTask(
      {
        workspaceId,
        projectId: values.projectId,
        data,
      },
      { onSuccess: () => onSuccess("Task created successfully"), onError }
    );
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1
            className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1
           text-center sm:text-left"
          >
            {isEdit ? "Edit Task" : "Create Task"}
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Organize and manage tasks, resources, and team collaboration
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website Redesign"
                        className="!h-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {Description} */}
            <div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={1} placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {ProjectId} */}

            {!projectId && !isEdit && (
              <div>
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoading && (
                            <div className="my-2">
                              <Loader className="w-4 h-4 place-self-center flex animate-spin" />
                            </div>
                          )}
                          {!isLoading && projectOptions.length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground">
                              Create a project first
                            </div>
                          )}
                          {projectOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              className="cursor-pointer"
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* {Members AssigneeTo} */}

            <div>
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                        {membersOptions.map((option) => (
                          <SelectItem
                            className="cursor-pointer"
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {Due Date} */}
            <div className="!mt-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Due Date
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full flex-1 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={
                            (date) =>
                              date <
                                new Date(new Date().setHours(0, 0, 0, 0)) || // Disable past dates
                              date > new Date("2100-12-31") //Prevent selection beyond a far future date
                          }
                          initialFocus
                          defaultMonth={field.value || new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {Status} */}

            <div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            className="!text-muted-foreground !capitalize"
                            placeholder="Select a status"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions?.map((status) => (
                          <SelectItem
                            className="!capitalize"
                            key={status.value}
                            value={status.value}
                          >
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* {Priority} */}
            <div>
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions?.map((priority) => (
                          <SelectItem
                            className="!capitalize"
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              disabled={isPending}
              className="flex place-self-end  h-[40px] text-white font-semibold"
              type="submit"
            >
              {isPending && <Loader className="animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
