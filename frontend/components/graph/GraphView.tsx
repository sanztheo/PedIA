"use client";

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import type { GraphData, GraphNode, GraphLink, EntityType } from "@/types";

interface GraphViewProps {
  data: GraphData;
  width?: number;
  height?: number;
  filters?: EntityType[];
  highlightedId?: string;
  onNodeClick?: (node: GraphNode) => void;
}

export interface GraphViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  centerOn: (nodeId: string) => void;
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
  height: number
): SimNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  return data.nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / data.nodes.length;
    const radius = Math.min(width, height) / 4;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });
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

export const GraphView = forwardRef<GraphViewRef, GraphViewProps>(function GraphView(
  { data, width = 800, height = 600, filters, highlightedId, onNodeClick },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const dragRef = useRef<SimNode | null>(null);
  
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isDraggingCanvas = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const stableFrames = useRef(0);
  const isSimulationRunning = useRef(false);
  const simulateFnRef = useRef<(() => void) | null>(null);

  const getFilteredData = useCallback(() => {
    if (!filters || filters.length === 0) {
      return { nodes: nodesRef.current, links: linksRef.current };
    }

    const filteredNodes = nodesRef.current.filter(
      (node) => node.type === "page" || (node.entityType && filters.includes(node.entityType))
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = linksRef.current.filter(
      (link) => nodeIds.has(link.sourceNode.id) && nodeIds.has(link.targetNode.id)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [filters]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = scaleRef.current;
    const offset = offsetRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const { nodes: currentNodes, links: currentLinks } = getFilteredData();

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1 / scale;
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
      const isHighlighted = highlightedId === node.id;

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${color}40`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (scale > 0.5) {
        ctx.font = `${10 / scale}px sans-serif`;
        ctx.fillStyle = document.documentElement.classList.contains("dark")
          ? "#d1d5db"
          : "#374151";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + radius + 12 / scale);
      }
    }

    ctx.restore();
  }, [width, height, getFilteredData, highlightedId]);

  useEffect(() => {
    if (data.nodes.length === 0) {
      nodesRef.current = [];
      linksRef.current = [];
      return;
    }

    const newNodes = initializeNodes(data, width, height);
    nodesRef.current = newNodes;
    linksRef.current = initializeLinks(data, newNodes);

    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };

    draw();
  }, [data, width, height, draw]);

  useEffect(() => {
    if (data.nodes.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    const runSimulationStep = () => {
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

      let totalVelocity = 0;
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

        totalVelocity += Math.abs(node.vx) + Math.abs(node.vy);
      }

      return totalVelocity;
    };

    const simulate = () => {
      if (!isSimulationRunning.current) return;

      const totalVelocity = runSimulationStep();
      draw();

      if (totalVelocity < 0.5) {
        stableFrames.current++;
        if (stableFrames.current > 60) {
          isSimulationRunning.current = false;
          return;
        }
      } else {
        stableFrames.current = 0;
      }

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulateFnRef.current = simulate;
    isSimulationRunning.current = true;
    stableFrames.current = 0;
    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      isSimulationRunning.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, width, height, draw]);

  const restartSimulation = useCallback(() => {
    if (!isSimulationRunning.current && simulateFnRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      isSimulationRunning.current = true;
      stableFrames.current = 0;
      animationRef.current = requestAnimationFrame(simulateFnRef.current);
    }
  }, []);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const scale = scaleRef.current;
    const offset = offsetRef.current;
    return {
      x: (screenX - offset.x) / scale,
      y: (screenY - offset.y) / scale,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x, y } = screenToWorld(screenX, screenY);

      for (const node of nodesRef.current) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < 144) {
          dragRef.current = node;
          restartSimulation();
          return;
        }
      }

      isDraggingCanvas.current = true;
      lastMousePos.current = { x: screenX, y: screenY };
    },
    [screenToWorld, restartSimulation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      if (dragRef.current) {
        const { x, y } = screenToWorld(screenX, screenY);
        dragRef.current.x = x;
        dragRef.current.y = y;
      } else if (isDraggingCanvas.current) {
        const dx = screenX - lastMousePos.current.x;
        const dy = screenY - lastMousePos.current.y;
        offsetRef.current.x += dx;
        offsetRef.current.y += dy;
        lastMousePos.current = { x: screenX, y: screenY };
        draw();
      }
    },
    [screenToWorld, draw]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    isDraggingCanvas.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, scaleRef.current * zoomFactor));

      const worldX = (mouseX - offsetRef.current.x) / scaleRef.current;
      const worldY = (mouseY - offsetRef.current.y) / scaleRef.current;

      offsetRef.current.x = mouseX - worldX * newScale;
      offsetRef.current.y = mouseY - worldY * newScale;
      scaleRef.current = newScale;

      draw();
    },
    [draw]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onNodeClick) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x, y } = screenToWorld(screenX, screenY);

      for (const node of nodesRef.current) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < 144) {
          onNodeClick(node);
          return;
        }
      }
    },
    [onNodeClick, screenToWorld]
  );

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      scaleRef.current = Math.min(5, scaleRef.current * 1.2);
      draw();
    },
    zoomOut: () => {
      scaleRef.current = Math.max(0.1, scaleRef.current * 0.8);
      draw();
    },
    reset: () => {
      scaleRef.current = 1;
      offsetRef.current = { x: 0, y: 0 };
      draw();
    },
    centerOn: (nodeId: string) => {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        offsetRef.current = {
          x: width / 2 - node.x * scaleRef.current,
          y: height / 2 - node.y * scaleRef.current,
        };
        draw();
      }
    },
  }), [draw, width, height]);

  if (data.nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/30 rounded-lg"
        style={{ width, height }}
      >
        <p className="text-muted-foreground">Aucune donnée</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg bg-background cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  );
});

export default GraphView;
