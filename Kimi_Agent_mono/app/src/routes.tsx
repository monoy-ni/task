import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import App from "./App";
import CreateProject from "./pages/CreateProject";
import TaskBreakdown from "./pages/TaskBreakdown";
import TestBreakdown from "./pages/TestBreakdown";
import GanttView from "./pages/GanttView";
import DailyTasksTimeline from "./pages/DailyTasksTimeline";
import ProjectDashboard from "./pages/ProjectDashboard";
import Review from "./pages/Review";
import History from "./pages/History";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: App },
      { path: "create", Component: CreateProject },
      { path: "task-breakdown", Component: TaskBreakdown },
      { path: "test-breakdown", Component: TestBreakdown },
      { path: "about", Component: About },
      { path: "history", Component: History },
      { path: "dashboard/:projectId", Component: ProjectDashboard },
      { path: "plan/:projectId", Component: GanttView },
      { path: "daily/:projectId", Component: DailyTasksTimeline },
      { path: "review/:projectId", Component: Review },
      { path: "login", Component: Login },
      { path: "pricing", Component: Pricing },
      { path: "profile", Component: Profile },
      { path: "*", Component: NotFound },
    ],
  },
]);
