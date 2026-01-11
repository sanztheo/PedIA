"use client";

import { useRef, useEffect, useCallback, useState } from "react";
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

export function GraphView({
  data,
  width = 800,
  height = 600,
  onNodeClick,
}: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const animationRef = useRef<number | null>(null);
  const dragRef = useRef<SimNode | null>(null);

  useEffect(() => {
    const nodeMap = new Map<string, SimNode>();

    const initialNodes = data.nodes.map((node) => {
      const simNode: SimNode = {
        ...node,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
      };
      nodeMap.set(node.id, simNode);
      return simNode;
    });

    const initialLinks = data.links
      .map((link) => {
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);
        if (!sourceNode || !targetNode) return null;
        return { ...link, sourceNode, targetNode };
      })
      .filter((link): link is SimLink => link !== null);

    setNodes(initialNodes);
    setLinks(initialLinks);
  }, [data, width, height]);

  const draw = useCallback(
    (currentNodes: SimNode[], currentLinks: SimLink[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

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
        ctx.fillStyle = "#374151";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + radius + 12);
      }
    },
    [width, height],
  );

  useEffect(() => {
    if (nodes.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    const simulate = () => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((node) => ({ ...node }));

        for (const node of newNodes) {
          node.vx += (centerX - node.x) * 0.001;
          node.vy += (centerY - node.y) * 0.001;
        }

        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            newNodes[i].vx -= fx;
            newNodes[i].vy -= fy;
            newNodes[j].vx += fx;
            newNodes[j].vy += fy;
          }
        }

        const nodeMap = new Map(newNodes.map((n) => [n.id, n]));
        for (const link of links) {
          const sourceNode = nodeMap.get(link.source);
          const targetNode = nodeMap.get(link.target);
          if (!sourceNode || !targetNode) continue;

          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.01;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }

        for (const node of newNodes) {
          if (dragRef.current && node.id === dragRef.current.id) continue;
          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;
          node.x = Math.max(20, Math.min(width - 20, node.x));
          node.y = Math.max(20, Math.min(height - 20, node.y));
        }

        return newNodes;
      });
    };

    const animate = () => {
      simulate();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, links, width, height]);

  useEffect(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const currentLinks = links.map((link) => ({
      ...link,
      sourceNode: nodeMap.get(link.source) || link.sourceNode,
      targetNode: nodeMap.get(link.target) || link.targetNode,
    }));
    draw(nodes, currentLinks);
  }, [nodes, links, draw]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const node of nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < 144) {
          dragRef.current = node;
          return;
        }
      }
    },
    [nodes],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === dragRef.current?.id
            ? { ...node, x, y, vx: 0, vy: 0 }
            : node,
        ),
      );
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

      for (const node of nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < 144) {
          onNodeClick(node);
          return;
        }
      }
    },
    [nodes, onNodeClick],
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
