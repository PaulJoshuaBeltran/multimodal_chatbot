// src/components/tabs/MessageVisualization.tsx
"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, Position, ReactFlow, type Edge, type Node } from "@xyflow/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";

// Input type: one tool call, exactly as emitted by the model / route.ts
export const VISUALIZATION_TOOLS = [
  "visualize_table",
  "visualize_area_chart",
  "visualize_bar_chart",
  "visualize_line_chart",
  "visualize_pie_chart",
  "visualize_radar_chart",
  "visualize_radial_chart",
  "visualize_flowchart",
] as const;

export interface VisualizationCall {
  name: string;
  args: Record<string, unknown>;
}

export const isVisualizationCall = (c: VisualizationCall) =>
  (VISUALIZATION_TOOLS as readonly string[]).includes(c.name);

// Arg helpers (small models often stringify nested values / numbers / booleans)
type Row = Record<string, unknown>;
type Indicator = "dot" | "line" | "dashed" | "none";
type Curve = "linear" | "natural" | "step";
interface Series {
  key: string;
  label?: string;
  color?: string;
}

function parseArg<T>(v: unknown): T | undefined {
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return undefined;
    }
  }
  return v as T | undefined;
}

const flag = (v: unknown, fallback = false) => (v === true || v === "true" ? true : v === false || v === "false" ? false : fallback);

const coerce = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : v;

const indicatorOf = (v: unknown): Indicator =>
  v === "line" || v === "dashed" || v === "none" ? v : "dot";

const defaultColor = (i: number) => `var(--chart-${(i % 5) + 1})`;

const tooltipEl = (indicator: Indicator, nameKey?: string, hideLabel?: boolean) =>
  indicator === "none" ? null : (
    <ChartTooltip
      cursor={false}
      content={<ChartTooltipContent indicator={indicator} nameKey={nameKey} hideLabel={hideLabel} />}
    />
  );

function Empty({ name }: { name: string }) {
  return <p className="text-sm text-muted-foreground">Could not render {name}: invalid or missing arguments.</p>;
}

// Cartesian (area / bar / line) + radar: data rows + x_key + series
function readCartesian(args: Record<string, unknown>) {
  const data = parseArg<Row[]>(args.data);
  const series = parseArg<Series[]>(args.series);
  const xKey = typeof args.x_key === "string" ? args.x_key : undefined;
  if (!Array.isArray(data) || !Array.isArray(series) || !series.length || !xKey) return null;

  const keys = series.map((s) => s.key);
  const rows = data.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, keys.includes(k) ? coerce(v) : v])),
  );
  const config: ChartConfig = Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label ?? s.key, color: s.color ?? defaultColor(i) }]),
  );
  return { rows, series, xKey, config, indicator: indicatorOf(args.tooltip) };
}

function CartesianChart({
  kind,
  args,
}: {
  kind: "area" | "bar" | "line" | "radar";
  args: Record<string, unknown>;
}) {
  const c = readCartesian(args);
  if (!c) return <Empty name={`${kind} chart`} />;
  const { rows, series, xKey, config, indicator } = c;

  const curve: Curve = args.curve === "linear" || args.curve === "step" ? args.curve : "natural";
  const stacked = flag(args.stacked);
  const color = (k: string) => `var(--color-${k})`;
  const tooltip = tooltipEl(indicator);
  const legend = series.length > 1 ? <ChartLegend content={<ChartLegendContent />} /> : null;
  const axisX = <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />;

  if (kind === "radar") {
    const filled = flag(args.filled, true);
    return (
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[320px]">
        <RadarChart data={rows}>
          {tooltip}
          <PolarAngleAxis dataKey={xKey} />
          <PolarGrid />
          {series.map((s) => (
            <Radar key={s.key} dataKey={s.key} fill={color(s.key)} fillOpacity={filled ? 0.5 : 0} stroke={color(s.key)} strokeWidth={2} />
          ))}
          {legend}
        </RadarChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={config} className="min-h-[240px] w-full">
      {kind === "area" ? (
        <AreaChart accessibilityLayer data={rows}>
          <CartesianGrid vertical={false} />
          {axisX}
          {tooltip}
          {series.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              type={curve}
              fill={color(s.key)}
              fillOpacity={0.4}
              stroke={color(s.key)}
              stackId={stacked ? "a" : undefined}
            />
          ))}
          {legend}
        </AreaChart>
      ) : kind === "line" ? (
        <LineChart accessibilityLayer data={rows} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          {axisX}
          {tooltip}
          {series.map((s) => (
            <Line key={s.key} dataKey={s.key} type={curve} stroke={color(s.key)} strokeWidth={2} dot={false} />
          ))}
          {legend}
        </LineChart>
      ) : (
        (() => {
          const horizontal = flag(args.horizontal);
          return (
            <BarChart accessibilityLayer data={rows} layout={horizontal ? "vertical" : "horizontal"}>
              <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
              {horizontal ? (
                <>
                  <YAxis dataKey={xKey} type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} />
                  <XAxis type="number" hide />
                </>
              ) : (
                axisX
              )}
              {tooltip}
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={color(s.key)} radius={4} stackId={stacked ? "a" : undefined} />
              ))}
              {legend}
            </BarChart>
          );
        })()
      )}
    </ChartContainer>
  );
}

// Pie + radial: [{ label, value, color? }]
function readSlices(args: Record<string, unknown>) {
  const data = parseArg<{ label: unknown; value: unknown; color?: string }[]>(args.data);
  if (!Array.isArray(data) || !data.length) return null;

  const config: ChartConfig = {};
  const rows = data.map((d, i) => {
    const id = `s${i}`; // safe CSS-variable key regardless of the label text
    config[id] = { label: String(d.label), color: d.color ?? defaultColor(i) };
    return { id, label: String(d.label), value: Number(d.value) || 0, fill: `var(--color-${id})` };
  });
  return { rows, config, indicator: indicatorOf(args.tooltip) };
}

function PieViz({ args }: { args: Record<string, unknown> }) {
  const s = readSlices(args);
  if (!s) return <Empty name="pie chart" />;
  return (
    <ChartContainer config={s.config} className="mx-auto aspect-square max-h-[320px]">
      <PieChart>
        {tooltipEl(s.indicator, "id", true)}
        <Pie data={s.rows} dataKey="value" nameKey="id" innerRadius={flag(args.donut) ? 60 : 0} strokeWidth={5} />
        <ChartLegend content={<ChartLegendContent nameKey="id" />} />
      </PieChart>
    </ChartContainer>
  );
}

function RadialViz({ args }: { args: Record<string, unknown> }) {
  const s = readSlices(args);
  if (!s) return <Empty name="radial chart" />;
  const max = Number(args.max);
  return (
    <ChartContainer config={s.config} className="mx-auto aspect-square max-h-[320px]">
      <RadialBarChart data={s.rows} innerRadius={30} outerRadius={110}>
        {tooltipEl(s.indicator, "id", true)}
        {Number.isFinite(max) && max > 0 && <PolarAngleAxis type="number" domain={[0, max]} tick={false} angleAxisId={0} />}
        <RadialBar dataKey="value" background />
        <ChartLegend content={<ChartLegendContent nameKey="id" />} />
      </RadialBarChart>
    </ChartContainer>
  );
}

// Table: rows[0] is rendered as the header
function TableViz({ args }: { args: Record<string, unknown> }) {
  const rows = parseArg<unknown[][]>(args.rows);
  if (!Array.isArray(rows) || !rows.length || !rows.every(Array.isArray)) return <Empty name="table" />;
  const [head, ...body] = rows;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head.map((h, i) => (
            <TableHead key={i}>{String(h)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {body.map((r, i) => (
          <TableRow key={i}>
            {head.map((_, j) => (
              <TableCell key={j}>{r[j] == null ? "" : String(r[j])}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Flowchart (@xyflow/react) with a tiny layered auto-layout when positions are missing
interface FlowNodeArg {
  id: string;
  label: string;
  type?: string;
  position?: { x: number; y: number };
}
interface FlowEdgeArg {
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
}

function autoLayout(nodes: FlowNodeArg[], edges: FlowEdgeArg[], dir: "TB" | "LR") {
  // Longest-path layering; the cap keeps cycles from looping forever.
  const depth = new Map(nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    for (const e of edges) {
      if (!depth.has(e.source) || !depth.has(e.target)) continue;
      const d = depth.get(e.source)! + 1;
      if (d > depth.get(e.target)! && d < nodes.length) depth.set(e.target, d);
    }
  }
  const layers = new Map<number, string[]>();
  for (const n of nodes) {
    const d = depth.get(n.id)!;
    layers.set(d, [...(layers.get(d) ?? []), n.id]);
  }
  const acrossGap = dir === "TB" ? 200 : 100;
  const alongGap = dir === "TB" ? 110 : 240;
  const pos = new Map<string, { x: number; y: number }>();
  layers.forEach((ids, d) =>
    ids.forEach((id, i) => {
      const across = (i - (ids.length - 1) / 2) * acrossGap;
      const along = d * alongGap;
      pos.set(id, dir === "TB" ? { x: across, y: along } : { x: along, y: across });
    }),
  );
  return pos;
}

function FlowchartViz({ args }: { args: Record<string, unknown> }) {
  const nodesArg = parseArg<FlowNodeArg[]>(args.nodes);
  const edgesArg = parseArg<FlowEdgeArg[]>(args.edges);
  if (!Array.isArray(nodesArg) || !nodesArg.length || !Array.isArray(edgesArg)) return <Empty name="flowchart" />;

  const dir = args.direction === "LR" ? "LR" : "TB";
  const needsLayout = nodesArg.some((n) => !n.position);
  const auto = needsLayout ? autoLayout(nodesArg, edgesArg, dir) : null;

  const nodes: Node[] = nodesArg.map((n) => ({
    id: n.id,
    data: { label: n.label },
    position: n.position ?? auto?.get(n.id) ?? { x: 0, y: 0 },
    type: n.type === "input" || n.type === "output" ? n.type : undefined,
    sourcePosition: dir === "LR" ? Position.Right : Position.Bottom,
    targetPosition: dir === "LR" ? Position.Left : Position.Top,
  }));

  const ids = new Set(nodes.map((n) => n.id));
  const edges: Edge[] = edgesArg
    .filter((e) => ids.has(e.source) && ids.has(e.target)) // drop edges pointing at hallucinated ids
    .map((e, i) => ({
      id: `${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: flag(e.animated),
      type: e.type && e.type !== "default" ? e.type : undefined,
    }));

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-lg border">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesConnectable={false} colorMode="system">
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// Public component
export default function MessageVisualization({ call }: { call: VisualizationCall }) {
  const { name, args } = call;

  let body: React.ReactNode;
  switch (name) {
    case "visualize_table":
      body = <TableViz args={args} />;
      break;
    case "visualize_area_chart":
      body = <CartesianChart kind="area" args={args} />;
      break;
    case "visualize_bar_chart":
      body = <CartesianChart kind="bar" args={args} />;
      break;
    case "visualize_line_chart":
      body = <CartesianChart kind="line" args={args} />;
      break;
    case "visualize_radar_chart":
      body = <CartesianChart kind="radar" args={args} />;
      break;
    case "visualize_pie_chart":
      body = <PieViz args={args} />;
      break;
    case "visualize_radial_chart":
      body = <RadialViz args={args} />;
      break;
    case "visualize_flowchart":
      body = <FlowchartViz args={args} />;
      break;
    default:
      return null;
  }

  return <div className="my-2 w-full rounded-xl border bg-card p-4 text-card-foreground">{body}</div>;
}

// Convenience: render every visualization call attached to one assistant message.
export function MessageVisualizations({ calls }: { calls: VisualizationCall[] }) {
  return (
    <>
      {calls.filter(isVisualizationCall).map((c, i) => (
        <MessageVisualization key={i} call={c} />
      ))}
    </>
  );
}