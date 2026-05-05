import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState,
  type OnConnect, Panel, Handle, Position, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, Play, Leaf, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function SubstrateNode({ data }: NodeProps<any>) {
  return (
    <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border-2 border-emerald-500/40 shadow-lg">
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="text-center">
        <p className="text-xs font-bold text-emerald-400">{data.label}</p>
        <p className="text-[9px] text-slate-400">{data.formula}</p>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
}

function EnzymeNode({ data }: NodeProps<any>) {
  return (
    <div className="px-3 py-2 rounded-lg bg-cyan-500/10 border-2 border-cyan-500/40 shadow-lg">
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="text-center">
        <p className="text-xs font-bold text-cyan-400">{data.label}</p>
        <p className="text-[9px] text-slate-400">{data.ec}</p>
        {data.flux && <p className="text-[9px] text-amber-400 mt-0.5">{data.flux} mmol/gDW/h</p>}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
}

function ProductNode({ data }: NodeProps<any>) {
  return (
    <div className="px-4 py-2 rounded-lg bg-violet-500/10 border-2 border-violet-500/40 shadow-lg">
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="text-center">
        <p className="text-xs font-bold text-violet-400">{data.label}</p>
        <p className="text-[9px] text-slate-400">{data.formula}</p>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
}

const nodeTypes = { substrate: SubstrateNode, enzyme: EnzymeNode, product: ProductNode };

const pathwayTemplates: Record<string, any> = {
  cellulose: {
    name: "Cellulose → Ethanol", description: "Cellulose hydrolysis and fermentation to ethanol", carbonSaved: "-1.8 tons CO₂e/batch",
    nodes: [
      { id: "1", type: "substrate", position: { x: 0, y: 100 }, data: { label: "Cellulose", formula: "(C₆H₁₀O₅)ₙ" } },
      { id: "2", type: "enzyme", position: { x: 200, y: 100 }, data: { label: "Cellulase", ec: "EC 3.2.1.4", flux: 12.5 } },
      { id: "3", type: "product", position: { x: 400, y: 50 }, data: { label: "Cellobiose", formula: "C₁₂H₂₂O₁₁" } },
      { id: "4", type: "enzyme", position: { x: 600, y: 50 }, data: { label: "β-Glucosidase", ec: "EC 3.2.1.21", flux: 8.3 } },
      { id: "5", type: "product", position: { x: 800, y: 50 }, data: { label: "Glucose", formula: "C₆H₁₂O₆" } },
      { id: "6", type: "enzyme", position: { x: 600, y: 150 }, data: { label: "Zymomonas", ec: "Fermentation", flux: 15.2 } },
      { id: "7", type: "product", position: { x: 800, y: 150 }, data: { label: "Ethanol", formula: "C₂H₅OH" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#10b981" } },
      { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#10b981" } },
      { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "#06b6d4" } },
      { id: "e4-5", source: "4", target: "5", animated: true, style: { stroke: "#06b6d4" } },
      { id: "e2-6", source: "2", target: "6", animated: true, style: { stroke: "#f59e0b" } },
      { id: "e6-7", source: "6", target: "7", animated: true, style: { stroke: "#f59e0b" } },
    ],
  },
  co2: {
    name: "CO₂ → Methanol", description: "Carbon capture and utilization pathway", carbonSaved: "-2.4 tons CO₂e/batch",
    nodes: [
      { id: "1", type: "substrate", position: { x: 0, y: 100 }, data: { label: "CO₂", formula: "CO₂" } },
      { id: "2", type: "enzyme", position: { x: 200, y: 100 }, data: { label: "CO₂ Capture", ec: "Adsorption", flux: 25.0 } },
      { id: "3", type: "product", position: { x: 400, y: 50 }, data: { label: "CO", formula: "CO" } },
      { id: "4", type: "enzyme", position: { x: 600, y: 50 }, data: { label: "RWGS", ec: "Catalyst", flux: 18.7 } },
      { id: "5", type: "product", position: { x: 800, y: 50 }, data: { label: "CH₃OH", formula: "CH₄O" } },
      { id: "6", type: "substrate", position: { x: 0, y: 200 }, data: { label: "H₂", formula: "H₂" } },
      { id: "7", type: "enzyme", position: { x: 400, y: 200 }, data: { label: "Electrolysis", ec: "EC 1.1.1", flux: 32.1 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#10b981" } },
      { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#10b981" } },
      { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "#06b6d4" } },
      { id: "e4-5", source: "4", target: "5", animated: true, style: { stroke: "#8b5cf6" } },
      { id: "e6-7", source: "6", target: "7", animated: true, style: { stroke: "#f59e0b" } },
      { id: "e7-4", source: "7", target: "4", animated: true, style: { stroke: "#f59e0b" } },
    ],
  },
  jet: {
    name: "Ethanol → Jet Fuel", description: "Ethanol upgrading to sustainable aviation fuel", carbonSaved: "-3.1 tons CO₂e/batch",
    nodes: [
      { id: "1", type: "substrate", position: { x: 0, y: 100 }, data: { label: "Ethanol", formula: "C₂H₅OH" } },
      { id: "2", type: "enzyme", position: { x: 200, y: 100 }, data: { label: "Dehydration", ec: "Acid Cat.", flux: 22.3 } },
      { id: "3", type: "product", position: { x: 400, y: 50 }, data: { label: "Ethylene", formula: "C₂H₄" } },
      { id: "4", type: "enzyme", position: { x: 600, y: 50 }, data: { label: "Oligomerization", ec: "Zeolite", flux: 14.8 } },
      { id: "5", type: "product", position: { x: 800, y: 50 }, data: { label: "Olefin", formula: "C₈-C₁₆" } },
      { id: "6", type: "enzyme", position: { x: 600, y: 150 }, data: { label: "Hydrotreating", ec: "HDO", flux: 11.2 } },
      { id: "7", type: "product", position: { x: 800, y: 150 }, data: { label: "Jet Fuel", formula: "C₈H₁₈-C₁₆H₃₄" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#10b981" } },
      { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#10b981" } },
      { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "#06b6d4" } },
      { id: "e4-5", source: "4", target: "5", animated: true, style: { stroke: "#06b6d4" } },
      { id: "e5-6", source: "5", target: "6", animated: true, style: { stroke: "#f59e0b" } },
      { id: "e6-7", source: "6", target: "7", animated: true, style: { stroke: "#8b5cf6" } },
    ],
  },
};

export default function Pathways() {
  const [activeTemplate, setActiveTemplate] = useState<keyof typeof pathwayTemplates>("cellulose");
  const [isSimulating, setIsSimulating] = useState(false);
  const template = pathwayTemplates[activeTemplate];

  const [nodes, setNodes, onNodesChange] = useNodesState(template.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(template.edges);

  const onConnect: OnConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleTemplateChange = (key: keyof typeof pathwayTemplates) => {
    setActiveTemplate(key);
    const t = pathwayTemplates[key];
    setNodes(t.nodes);
    setEdges(t.edges);
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    setNodes((prev) =>
      prev.map((n) =>
        n.type === "enzyme"
          ? { ...n, data: { ...n.data, flux: +(Math.max(0.5, (n.data.flux || 10) * (0.85 + Math.random() * 0.4))).toFixed(1) } }
          : n
      )
    );
    setEdges((prev) => prev.map((e) => ({ ...e, animated: true, style: { ...e.style, strokeWidth: 2 + Math.random() * 2 } })));
    setTimeout(() => setIsSimulating(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-cyan-400" />Metabolic Pathways
          </h1>
          <p className="text-sm text-slate-400 mt-1">Visualize and optimize synthetic biology pathways</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">{template.carbonSaved} CO₂e</span>
          </div>
          <Button className="gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold" onClick={handleSimulate} disabled={isSimulating}>
            <Play className="w-4 h-4" />{isSimulating ? "Simulating..." : "Simulate Flux"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(Object.keys(pathwayTemplates) as Array<keyof typeof pathwayTemplates>).map((key) => {
          const t = pathwayTemplates[key];
          return (
            <button key={key} onClick={() => handleTemplateChange(key)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeTemplate === key ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700"}`}>
              {t.name}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-slate-400">{template.description}</p>

      <Card className="h-[500px]">
        <CardContent className="p-0 h-full">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            nodeTypes={nodeTypes} fitView className="bg-slate-950 rounded-lg">
            <Background color="#334155" gap={20} size={1} />
            <Controls className="bg-slate-800 border-slate-700 text-slate-100" />
            <MiniMap className="bg-slate-800 border-slate-700" maskColor="rgb(15, 23, 42, 0.7)"
              nodeColor={(node) => node.type === "substrate" ? "#10b981" : node.type === "enzyme" ? "#06b6d4" : "#8b5cf6"} />
            <Panel position="top-left" className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-slate-300">Substrate</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-[10px] text-slate-300">Enzyme/Catalyst</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-500" /><span className="text-[10px] text-slate-300">Product</span></div>
              </div>
            </Panel>
            {isSimulating && (
              <Panel position="bottom-center">
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-cyan-500/30 flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-xs text-cyan-400">Running FBA simulation...</span>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-3">
        {nodes.filter((n) => n.type === "enzyme").map((node, i) => (
          <motion.div key={node.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-slate-800/30 border border-slate-800 rounded-lg p-3">
            <p className="text-xs font-medium text-cyan-400">{node.data.label}</p>
            <p className="text-[10px] text-slate-500">{node.data.ec}</p>
            <p className="text-lg font-bold text-amber-400 mt-1">{node.data.flux}</p>
            <p className="text-[9px] text-slate-500">mmol/gDW/h</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
