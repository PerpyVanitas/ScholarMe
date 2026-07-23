"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Award } from "lucide-react";

export interface CompetencyData {
  category: string;
  score: number; // 0 - 100
}

interface CompetencyRadarChartProps {
  competencies: CompetencyData[];
}

export function CompetencyRadarChart({ competencies }: CompetencyRadarChartProps) {
  // Ensure exactly 6 radial axis data points
  const defaultCategories = [
    "Data Structures",
    "Web & Backend",
    "Database Systems",
    "Mathematics",
    "Software Eng.",
    "General Sciences",
  ];

  const dataPoints = defaultCategories.map((cat) => {
    const found = competencies.find((c) => c.category.toLowerCase().includes(cat.toLowerCase().slice(0, 4)));
    return {
      category: cat,
      score: found ? Math.min(100, Math.max(10, found.score)) : 75, // Default fallback score
    };
  });

  const center = 120;
  const radius = 80;
  const totalAxes = dataPoints.length;

  // Calculate polygon coordinates
  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate background concentric grid polygons
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonPoints = dataPoints
    .map((dp, i) => {
      const { x, y } = getCoordinates(dp.score, i);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="border bg-card/60 backdrop-blur shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> CIT-U Competency Radar
            </CardTitle>
            <CardDescription className="text-xs">
              6-Axis Mastery Profile across core academic engineering domains.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <Award className="h-3.5 w-3.5 text-amber-500" /> Mastery Radar
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col md:flex-row items-center justify-around gap-6">
        {/* SVG Radar Visualization */}
        <div className="relative w-60 h-60 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 240 240">
            {/* Concentric Grid Lines */}
            {gridLevels.map((level, idx) => {
              const gridPoints = dataPoints
                .map((_, i) => {
                  const { x, y } = getCoordinates(100 * level, i);
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <polygon
                  key={idx}
                  points={gridPoints}
                  className="fill-none stroke-muted/40 stroke-1"
                  strokeDasharray={idx < 3 ? "2 2" : undefined}
                />
              );
            })}

            {/* Radial Axes */}
            {dataPoints.map((_, i) => {
              const { x, y } = getCoordinates(100, i);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  className="stroke-muted/40 stroke-1"
                />
              );
            })}

            {/* Filled Polygon */}
            <polygon
              points={polygonPoints}
              className="fill-primary/20 stroke-primary stroke-2"
            />

            {/* Data Point Nodes */}
            {dataPoints.map((dp, i) => {
              const { x, y } = getCoordinates(dp.score, i);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  className="fill-primary stroke-background stroke-2 hover:r-6 transition-all cursor-pointer"
                >
                  <title>{`${dp.category}: ${dp.score}%`}</title>
                </circle>
              );
            })}
          </svg>
        </div>

        {/* Competency Legend Breakdown */}
        <div className="w-full space-y-2 text-xs">
          {dataPoints.map((dp, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
              <span className="font-medium text-foreground">{dp.category}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${dp.score}%` }}
                  />
                </div>
                <span className="font-bold w-8 text-right text-primary">{dp.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
