import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { demoLoginMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

// Creates a private, pre-filled workspace so visitors can try the app
// without signing up.
const DemoLoginButton = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: demoLoginMutationFn,
  });

  const handleClick = () => {
    if (isPending) return;
    mutate(undefined, {
      onSuccess: async (data) => {
        await queryClient.refetchQueries({ queryKey: ["authUser"] });
        navigate(`/workspace/${data.user.currentWorkspace}`);
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
    <div className="flex flex-col gap-1.5">
      <Button
        onClick={handleClick}
        type="button"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? <Loader className="animate-spin" /> : <Sparkles />}
        {isPending ? "Setting up your demo..." : "Try the demo"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No sign-up needed. You get a sample team workspace for 24 hours.
      </p>
    </div>
  );
};

export default DemoLoginButton;
