import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

// status / priority / labels hold comma-separated values (multi-select filters)
const useTaskTableFilter = () => {
  return useQueryStates({
    status: parseAsString,
    priority: parseAsString,
    keyword: parseAsString,
    projectId: parseAsString,
    assigneeId: parseAsString,
    labels: parseAsString,
  });
};

export const useTaskView = () => {
  return useQueryStates({
    view: parseAsStringLiteral([
      "board",
      "table",
      "calendar",
    ] as const).withDefault("board"),
  });
};

export default useTaskTableFilter;
