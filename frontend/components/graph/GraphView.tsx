"use client";

import { useRef, useEffect, useCallback } from "react";
import type { GraphData, GraphNode, GraphLink } from "@/types";

interface GraphViewProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

const NODE_COLORS: Record<string, string> = {
  page: "#3b82f6",
  PERSON: "#60a5fa",
  ORGANIZATION: "#34d399",
  LOCATION: "#fbbf24",
  EVENT: "#a78bfa",
  CONCEPT: "#f472b6",
  WORK: "#818cf8",
  OTHER: "#9ca3af",
};

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimLink extends GraphLink {
  sourceNode: SimNode;
  targetNode: SimNode;
}

function initializeNodes(
  data: GraphData,
  width: number,
  height: number,
): SimNode[] {
  return data.nodes.map((node) => ({
    ...node,
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
  }));
}

function initializeLinks(data: GraphData, nodes: SimNode[]): SimLink[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return data.links
    .map((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);
      if (!sourceNode || !targetNode) return null;
      return { ...link, sourceNode, targetNode };
    })
    .filter((link): link is SimLink => link !== null);
}

export function GraphView({
  data,
  width = 800,
  height = 600,
  onNodeClick,
}: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const dragRef = useRef<SimNode | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const currentNodes = nodesRef.current;
    const currentLinks = linksRef.current;

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (const link of currentLinks) {
      ctx.beginPath();
      ctx.moveTo(link.sourceNode.x, link.sourceNode.y);
      ctx.lineTo(link.targetNode.x, link.targetNode.y);
      ctx.stroke();
    }

    for (const node of currentNodes) {
      const color =
        node.type === "page"
          ? NODE_COLORS.page
          : NODE_COLORS[node.entityType || "OTHER"];
      const radius = node.type === "page" ? 12 : 8;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.font = "10px sans-serif";
      ctx.fillStyle = document.documentElement.classList.contains("dark")
        ? "#d1d5db"
        : "#374151";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + radius + 12);
    }
  }, [width, height]);

  useEffect(() => {
    if (data.nodes.length === 0) {
      nodesRef.current = [];
      linksRef.current = [];
      return;
    }

    const newNodes = initializeNodes(data, width, height);
    nodesRef.current = newNodes;
    linksRef.current = initializeLinks(data, newNodes);

    draw();
  }, [data, width, height, draw]);

  useEffect(() => {
    if (data.nodes.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    const simulate = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      for (const node of nodes) {
        node.vx += (centerX - node.x) * 0.001;
        node.vy += (centerY - node.y) * 0.001;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 300) {
            const force = 1000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      for (const link of links) {
        const dx = link.targetNode.x - link.sourceNode.x;
        const dy = link.targetNode.y - link.sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 100) * 0.01;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        link.sourceNode.vx += fx;
        link.sourceNode.vy += fy;
        link.targetNode.vx -= fx;
        link.targetNode.vy -= fy;
      }

      for (const node of nodes) {
        if (dragRef.current && node.id === dragRef.current.id) {
          node.vx = 0;
          node.vy = 0;
          continue;
        }

        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }

      draw();

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, width, height, draw]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const node of nodesRef.current) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < 144) {
          dragRef.current = node;
          return;
        }
      }
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      dragRef.current.x = e.clientX - rect.left;
      dragRef.current.y = e.clientY - rect.top;
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onNodeClick) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const node of nodesRef.current) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < 144) {
          onNodeClick(node);
          return;
        }
      }
    },
    [onNodeClick],
  );

  if (data.nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg"
        style={{ width, height }}
      >
        <p className="text-gray-500 dark:text-gray-400">Aucune donnée</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg bg-white dark:bg-gray-800 cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    />
  );
}

export default GraphView;
