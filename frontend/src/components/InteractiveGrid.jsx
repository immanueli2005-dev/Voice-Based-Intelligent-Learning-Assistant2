import React, { useEffect, useRef } from 'react';

export default function InteractiveGrid({ theme, isChatActive }) {
  const canvasRef = useRef(null);
  const bubblesRef = useRef([]);

  // Generate bubbles on initialize or resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const width = canvas.width;
      const height = canvas.height;

      // Create a set of bubbles
      const bubbleCount = Math.min(45, Math.floor(width / 30));
      const generated = [];
      for (let i = 0; i < bubbleCount; i++) {
        const radius = Math.random() * 25 + 8;
        const baseX = Math.random() * width;
        const y = Math.random() * (height + 100);
        generated.push({
          baseX,
          x: baseX,
          y,
          radius,
          speedY: Math.random() * 0.4 + 0.15,
          wobbleSpeed: Math.random() * 0.015 + 0.005,
          wobbleRange: Math.random() * 15 + 5,
          wobbleOffset: Math.random() * Math.PI * 2
        });
      }
      bubblesRef.current = generated;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId;

    const loop = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      bubblesRef.current.forEach(bubble => {
        // If chat is NOT active, update physics (animate)
        if (!isChatActive) {
          bubble.y -= bubble.speedY;
          bubble.wobbleOffset += bubble.wobbleSpeed;
          bubble.x = bubble.baseX + Math.sin(bubble.wobbleOffset) * bubble.wobbleRange;

          // Wrap bubbles when they drift off top
          if (bubble.y < -bubble.radius * 2) {
            bubble.y = height + bubble.radius * 2;
            bubble.baseX = Math.random() * width;
          }
        }

        // Draw bubble
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.05)'; // Soft sky blue
        ctx.fill();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Highlight/shine reflection in bubble
        ctx.beginPath();
        ctx.arc(bubble.x - bubble.radius * 0.35, bubble.y - bubble.radius * 0.35, bubble.radius * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
      });

      animFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isChatActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}
