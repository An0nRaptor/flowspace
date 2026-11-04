import ActivityFeed from "@/components/workspace/activity/activity-feed";

export default function Activity() {
  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity</h2>
          <p className="text-muted-foreground">
            Everything that happened in this workspace, newest first.
          </p>
        </div>
      </div>
      <div className="max-w-3xl">
        <ActivityFeed />
      </div>
    </div>
  );
}
