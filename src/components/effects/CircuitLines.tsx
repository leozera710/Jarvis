"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
}

export default function CircuitLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const points: Point[] = [];
    const numPoints = 50;
    const connectionDistance = 200;

    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
      });
    }

    let pulseOffset = 0;

    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pulseOffset += 0.02;

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1;

        for (let j = i + 1; j < points.length; j++) {
          const other = points[j];
          const dx = other.x - point.x;
          const dy = other.y - point.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.5;
            
            const gradient = ctx.createLinearGradient(point.x, point.y, other.x, other.y);
            const pulsePos = (Math.sin(pulseOffset + i * 0.1) + 1) / 2;
            
            gradient.addColorStop(0, "rgba(57, 255, 20, 0)");
            gradient.addColorStop(pulsePos * 0.4, "rgba(57, 255, 20, " + alpha + ")");
            gradient.addColorStop(pulsePos * 0.5, "rgba(255, 255, 255, " + alpha + ")");
            gradient.addColorStop(pulsePos * 0.6, "rgba(57, 255, 20, " + alpha + ")");
            gradient.addColorStop(1, "rgba(57, 255, 20, 0)");

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = "#39FF14";
        ctx.shadowColor = "#39FF14";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const interval = setInterval(draw, 30);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-60 pointer-events-none"
    />
  );
}
