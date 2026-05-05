import { useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { ChatSidebar } from "@/components/ai-copilot/ChatSidebar";
import { useAppContext } from "@/stores/app-context";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const location = useLocation();
  const { setContext } = useAppContext();

  useEffect(() => {
    const page = location.pathname.split("/")[1] || "dashboard";
    setContext({ currentPage: page });
  }, [location, setContext]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
      <ChatSidebar isOpen={copilotOpen} onToggle={() => setCopilotOpen(!copilotOpen)} />
    </div>
  );
}
