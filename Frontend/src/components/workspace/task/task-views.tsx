import { Columns3, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskView } from "@/hooks/use-task-table-filter";
import TaskBoard from "./task-board";
import TaskTable from "./task-table";

const TaskViews = () => {
  const [{ view }, setView] = useTaskView();

  return (
    <div className="w-full space-y-3">
      <Tabs
        value={view}
        onValueChange={(value) => setView({ view: value as typeof view })}
      >
        <TabsList>
          <TabsTrigger value="board" className="gap-1.5">
            <Columns3 className="h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-1.5">
            <Table2 className="h-4 w-4" />
            Table
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {view === "board" ? <TaskBoard /> : <TaskTable />}
    </div>
  );
};

export default TaskViews;
