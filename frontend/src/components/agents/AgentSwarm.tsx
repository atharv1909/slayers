import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, FlaskConical, Eye, Brain, Terminal } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Agent {
  id: string;
  name: string;
  icon: React.ElementType;
  status: "idle" | "working" | "complete";
  progress: number;
  currentTask: string;
  color: string;
}

const initialAgents: Agent[] = [
  { id: "scout", name: "Nagarjuna", icon: Search, status: "idle", progress: 0, currentTask: "Waiting...", color: "cyan" },
  { id: "designer", name: "Kanada", icon: FlaskConical, status: "idle", progress: 0, currentTask: "Waiting...", color: "violet" },
  { id: "oracle", name: "Vagbhata", icon: Eye, status: "idle", progress: 0, currentTask: "Waiting...", color: "emerald" },
  { id: "sage", name: "Somadeva", icon: Brain, status: "idle", progress: 0, currentTask: "Waiting...", color: "amber" },
];

const tasks: Record<string, string[]> = {
  scout: ["Connecting to databases...", "Querying Materials Project...", "Fetching Open Catalyst data...", "Retrieving BRENDA entries...", "Compiling known catalysts..."],
  designer: ["Initializing generative model...", "Encoding known catalysts...", "Generating novel SMILES...", "Validating structures...", "Ranking candidates..."],
  oracle: ["Loading prediction models...", "Calculating descriptors...", "Predicting activity...", "Predicting selectivity...", "Computing stability scores..."],
  sage: ["Analyzing results...", "Cross-referencing literature...", "Generating hypotheses...", "Ranking by weighted score...", "Finalizing report..."],
};

interface AgentSwarmProps {
  isRunning: boolean;
  onComplete: () => void;
  logs: string[];
  onLog: (msg: string) => void;
}

export function AgentSwarm({ isRunning, onComplete, logs, onLog }: AgentSwarmProps) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  useEffect(() => {
    if (!isRunning) {
      setAgents(initialAgents);
      return;
    }

    const runAgent = async (agentIndex: number) => {
      if (agentIndex >= agents.length) {
        onLog("[SAGE] Discovery complete. All results compiled.");
        onComplete();
        return;
      }

      const agentId = agents[agentIndex].id;
      const agentTasks = tasks[agentId];

      setAgents((prev) =>
        prev.map((a, i) =>
          i === agentIndex
            ? { ...a, status: "working" as const, progress: 0, currentTask: agentTasks[0] }
            : i < agentIndex
            ? { ...a, status: "complete" as const, progress: 100 }
            : a
        )
      );

      for (let i = 0; i < agentTasks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
        const progress = ((i + 1) / agentTasks.length) * 100;
        setAgents((prev) => prev.map((a, idx) => (idx === agentIndex ? { ...a, progress, currentTask: agentTasks[i] } : a)));
        onLog(`[${agents[agentIndex].name.toUpperCase()}] ${agentTasks[i]}`);
      }

      setAgents((prev) => prev.map((a, i) => (i === agentIndex ? { ...a, status: "complete" as const, progress: 100 } : a)));
      setTimeout(() => runAgent(agentIndex + 1), 300);
    };

    runAgent(0);
  }, [isRunning]);

  const getColors = (agent: Agent) => {
    const map: Record<string, any> = {
      cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", progress: "bg-cyan-500" },
      violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", progress: "bg-violet-500" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", progress: "bg-emerald-500" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", progress: "bg-amber-500" },
    };
    return map[agent.color] || map.cyan;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {agents.map((agent, index) => {
          const colors = getColors(agent);
          const Icon = agent.icon;
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-xl border ${colors.border} ${colors.bg} p-4 ${agent.status === "working" ? "agent-pulse active" : ""}`}
            >
              {index < agents.length - 1 && <div className="absolute right-0 top-1/2 translate-x-[calc(50%+6px)] w-3 h-[2px] bg-slate-700 z-10" />}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{agent.name}</h3>
                  <p className={`text-[10px] ${colors.text} capitalize`}>{agent.status}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={agent.progress} className="h-1.5 bg-slate-800" />
                <p className="text-[10px] text-slate-400 truncate">{agent.currentTask}</p>
              </div>
              {agent.status === "complete" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                  <span className={`text-[10px] ${colors.text}`}>✓</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-400">Discovery Logs</span>
        </div>
        <div className="h-32 overflow-y-auto space-y-1 font-mono text-[11px]">
          {logs.map((log, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={
              log.includes("[SCOUT]") ? "text-cyan-400" :
              log.includes("[DESIGNER]") ? "text-violet-400" :
              log.includes("[ORACLE]") ? "text-emerald-400" :
              log.includes("[SAGE]") ? "text-amber-400" :
              log.includes("[ERROR]") ? "text-red-400" :
              "text-slate-400"
            }>
              <span className="text-slate-600">{new Date().toLocaleTimeString()}</span> {log}
            </motion.div>
          ))}
          {isRunning && <div className="text-slate-600 terminal-cursor" />}
        </div>
      </div>
    </div>
  );
}
