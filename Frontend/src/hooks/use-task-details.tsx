import { parseAsString, useQueryState } from "nuqs";

// ?task=<id> opens a task's details from search results and notifications.
const useTaskDetails = () => {
  const [taskId, setTaskId] = useQueryState("task", parseAsString);
  const onOpen = (id: string) => setTaskId(id);
  const onClose = () => setTaskId(null);
  return {
    taskId,
    onOpen,
    onClose,
  };
};

export default useTaskDetails;
