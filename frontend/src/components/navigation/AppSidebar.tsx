import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Beaker,
  GitBranch,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Atom,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Discovery", href: "/discovery", icon: FlaskConical },
  { label: "Experiments", href: "/experiments", icon: Beaker },
  { label: "Pathways", href: "/pathways", icon: GitBranch },
];

export function AppSidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 240 : 72 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-sm z-20 h-screen flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Atom className="w-5 h-5 text-cyan-400" />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
                Catalysis<span className="text-cyan-400">OS</span>
              </h1>
              <p className="text-[10px] text-slate-500 whitespace-nowrap -mt-0.5">GPS Renewables</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} to={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-cyan-400")} />
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1 flex-shrink-0">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 w-full">
          <Settings className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                <p className="text-xs text-slate-300 truncate max-w-[140px]">Researcher</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 z-30"
      >
        {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
