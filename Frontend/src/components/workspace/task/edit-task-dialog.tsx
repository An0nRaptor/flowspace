import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TaskType } from "@/types/api.type";
import CreateTaskForm from "./create-task-form";

const EditTaskDialog = (props: {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { task, isOpen, onClose } = props;
  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[95vh] overflow-y-auto my-5 border-0">
        {isOpen && <CreateTaskForm task={task} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
