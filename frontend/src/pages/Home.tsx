import { motion } from "framer-motion";
import { FlaskConical, Beaker, GitBranch, TrendingUp, Atom, ArrowRight, Zap, Leaf, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const stats = [
  { label: "Active Projects", value: "3", icon: FlaskConical, color: "cyan" },
  { label: "Candidates", value: "31", icon: Atom, color: "violet" },
  { label: "Experiments", value: "12", icon: Beaker, color: "emerald" },
  { label: "Pathways", value: "5", icon: GitBranch, color: "amber" },
];

const recentActivity = [
  { action: "Discovery completed", detail: "23 known + 8 novel catalysts for CO2→Methanol", time: "2h ago", type: "success" },
  { action: "Experiment logged", detail: "Pt/TiO2: 34% yield (predicted: 78%)", time: "4h ago", type: "warning" },
  { action: "Model retrained", detail: "8.3% accuracy improvement", time: "6h ago", type: "info" },
  { action: "Pathway created", detail: "Cellulose→Glucose→Ethanol", time: "1d ago", type: "success" },
];

export default function Home() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">CatalysisOS for GPS Renewables — Ethanol-to-Jet Fuel Program</p>
        </div>
        <Link to="/discovery">
          <Button className="gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold">
            <Zap className="w-4 h-4" />Launch Discovery
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-100 mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <CardTitle className="text-lg">Ethanol to Jet Fuel</CardTitle>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reaction</p>
                  <p className="text-sm font-mono text-cyan-400 mt-1">CO₂ + H₂ → CH₃OH → Jet Fuel</p>
                </div>
                <div className="w-24 bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Phase</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">Discovery</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500">Top Candidate</p>
                  <p className="text-sm font-semibold text-slate-100">Pt/TiO₂</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Activity: 0.89</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500">Best Yield</p>
                  <p className="text-sm font-semibold text-slate-100">78%</p>
                  <p className="text-[10px] text-slate-400 mt-1">Predicted</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500">Carbon Saved</p>
                  <p className="text-sm font-semibold text-emerald-400">-2.4 t</p>
                  <p className="text-[10px] text-slate-400 mt-1">CO₂e/batch</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">Carbon Impact Score: -2.4 tons CO₂e per batch</span>
                </div>
                <Link to="/discovery">
                  <Button variant="ghost" size="sm" className="gap-1 text-cyan-400 hover:text-cyan-300">View Details<ArrowRight className="w-3 h-3" /></Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-800/50 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activity.type === "success" ? "bg-emerald-500" : activity.type === "warning" ? "bg-amber-500" : "bg-cyan-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200">{activity.action}</p>
                    <p className="text-[11px] text-slate-400 truncate">{activity.detail}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
