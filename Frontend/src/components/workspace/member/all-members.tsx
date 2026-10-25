import { ChevronDown, Loader } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";
import { changeWorkspaceMemberRoleMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const roleDescriptions: Record<string, string> = {
  OWNER: "Admin-level access to all resources.",
  ADMIN: "Can view, create, edit tasks, project and manage settings.",
  MEMBER: "Can view, create and edit tasks.",
};

const AllMembers = () => {
  const { user, hasPermission } = useAuthContext();
  const canChangeMemberRole = hasPermission(Permissions.CHANGE_MEMBER_ROLE);

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { data, isPending } = useGetWorkspaceMembers(workspaceId);
  const members = data?.members || [];
  const roles = (data?.roles || []).filter((role) => role.name !== "OWNER");

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: changeWorkspaceMemberRoleMutationFn,
  });

  const handleSelect = (roleId: string, memberId: string) => {
    if (!roleId || !memberId) return;
    const payload = {
      workspaceId,
      data: {
        roleId,
        memberId,
      },
    };
    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["members", workspaceId],
        });
        queryClient.invalidateQueries({
          queryKey: ["workspace", workspaceId],
        });
        toast({
          title: "Success",
          description: "Member's role changed successfully",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="grid gap-6 pt-2">
      {isPending ? (
        <Loader className="w-8 h-8 animate-spin place-self-center flex" />
      ) : null}

      {members.map((member) => {
        const name = member.userId?.name;
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);
        const roleName = member.role?.name;
        const isSelf = member.userId._id === user?._id;
        const disabled = isLoading || !canChangeMemberRole || isSelf || roleName === "OWNER";

        return (
          <div
            key={member._id}
            className="flex items-center justify-between space-x-4"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={member.userId?.profilePicture || ""}
                  alt="Image"
                />
                <AvatarFallback className={avatarColor}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">
                  {name}
                  {isSelf && (
                    <span className="ml-1 text-muted-foreground font-normal">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.userId.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="ml-auto min-w-24 capitalize disabled:opacity-95 disabled:pointer-events-none"
                  >
                    {roleName?.toLowerCase()}
                    {!disabled && (
                      <ChevronDown className="text-muted-foreground" />
                    )}
                  </Button>
                </PopoverTrigger>
                {!disabled && (
                  <PopoverContent className="p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Select new role..." />
                      <CommandList>
                        <CommandEmpty>No roles found.</CommandEmpty>
                        <CommandGroup>
                          {roles.map((role) => (
                            <CommandItem
                              key={role._id}
                              disabled={isLoading}
                              className="disabled:pointer-events-none gap-1 mb-1 flex flex-col items-start px-4 py-1 cursor-pointer"
                              onSelect={() =>
                                handleSelect(role._id, member.userId._id)
                              }
                            >
                              <p className="capitalize">
                                {role.name?.toLowerCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {roleDescriptions[role.name]}
                              </p>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AllMembers;
