import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Home from "./pages/Home";
import CreateProject from "./pages/CreateProject";
import TaskBreakdown from "./pages/TaskBreakdown";
import TestBreakdown from "./pages/TestBreakdown";
import GanttView from "./pages/GanttView";
import DailyTasksTimeline from "./pages/DailyTasksTimeline";
import ProjectDashboard from "./pages/ProjectDashboard";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "create", Component: CreateProject },
      { path: "task-breakdown", Component: TaskBreakdown },
      { path: "test-breakdown", Component: TestBreakdown },
      { path: "dashboard/:projectId", Component: ProjectDashboard },
      { path: "plan/:projectId", Component: GanttView },
      { path: "daily/:projectId", Component: DailyTasksTimeline },
      { path: "review/:projectId", Component: Review },
      { path: "*", Component: NotFound },
    ],
  },
]);