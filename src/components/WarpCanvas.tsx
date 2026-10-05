import React, { useEffect, useRef } from 'react';

interface WarpCanvasProps {
  combo: number;
  triggerShockwaveRef: React.MutableRefObject<((x?: number, y?: number, color?: string) => void) | null>;
}

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  size: number;
  hue: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  width: number;
}

export const WarpCanvas: React.FC<WarpCanvasProps> = ({ combo, triggerShockwaveRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const comboRef = useRef(combo);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const STAR_COUNT = 450;
    const stars: Star[] = [];

    const resetStar = (star: Star) => {
      star.x = (Math.random() - 0.5) * width * 2;
      star.y = (Math.random() - 0.5) * height * 2;
      star.z = width;
      star.pz = width;
      star.size = Math.random() * 1.5 + 0.5;
      star.hue = Math.floor(Math.random() * 60) + 180; // Default cyan/blue
    };

    for (let i = 0; i < STAR_COUNT; i++) {
      const star: Star = {
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        pz: width,
        size: Math.random() * 1.5 + 0.5,
        hue: Math.floor(Math.random() * 60) + 180,
      };
      star.pz = star.z;
      stars.push(star);
    }

    const shockwaves: Shockwave[] = [];

    triggerShockwaveRef.current = (cx?: number, cy?: number, customColor?: string) => {
      const x = cx ?? width / 2;
      const y = cy ?? height / 2;
      const currentCombo = comboRef.current;

      let color = customColor;
      if (!color) {
        if (currentCombo >= 15) color = '#ff0055';
        else if (currentCombo >= 8) color = '#ff9900';
        else if (currentCombo >= 4) color = '#c084fc';
        else if (currentCombo >= 2) color = '#00f0ff';
        else color = '#38bdf8';
      }

      shockwaves.push({
        x,
        y,
        radius: 10,
        maxRadius: Math.max(width, height) * 0.75,
        color,
        alpha: 0.85,
        width: Math.min(8, 2 + currentCombo * 0.4),
      });
    };

    let targetSpeed = 2;
    let currentSpeed = 2;

    const render = () => {
      const c = comboRef.current;
      targetSpeed = Math.min(2 + c * 3.5, 65);
      currentSpeed += (targetSpeed - currentSpeed) * 0.1;

      // Dark futuristic space backdrop with slight trail persistence
      ctx.fillStyle = c > 10 ? 'rgba(5, 4, 15, 0.35)' : 'rgba(8, 7, 18, 0.45)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Render Stars / Warp streaks
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.pz = star.z;
        star.z -= currentSpeed;

        if (star.z <= 0) {
          resetStar(star);
          continue;
        }

        const k = 280 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px < 0 || px >= width || py < 0 || py >= height) {
          resetStar(star);
          continue;
        }

        const pk = 280 / star.pz;
        const prevPx = star.x * pk + cx;
        const prevPy = star.y * pk + cy;

        // Dynamic star color depending on combo tier
        let strokeColor = '';
        if (c >= 20) {
          // Rainbow quantum warp
          const hue = (star.hue + Date.now() * 0.2) % 360;
          strokeColor = `hsla(${hue}, 100%, 75%, ${Math.min(1, (1 - star.z / width) * 1.5)})`;
        } else if (c >= 10) {
          // Blazing gold/orange
          strokeColor = `rgba(255, ${Math.floor(140 + Math.random() * 80)}, 30, ${Math.min(1, (1 - star.z / width) * 1.4)})`;
        } else if (c >= 5) {
          // Magenta / Electric Purple
          strokeColor = `rgba(240, 60, 255, ${Math.min(1, (1 - star.z / width) * 1.3)})`;
        } else if (c >= 2) {
          // Neon Cyan / Turquoise
          strokeColor = `rgba(0, 245, 255, ${Math.min(1, (1 - star.z / width) * 1.2)})`;
        } else {
          // Cool Ice Blue / White
          strokeColor = `rgba(180, 220, 255, ${Math.min(1, (1 - star.z / width))})`;
        }

        ctx.beginPath();
        if (currentSpeed > 5) {
          // Draw streak
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.min(star.size * (1 - star.z / width) * 2.2, 3.5);
          ctx.lineCap = 'round';
          ctx.stroke();
        } else {
          // Draw dot
          ctx.arc(px, py, star.size * (1 - star.z / width) * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = strokeColor;
          ctx.fill();
        }
      }

      // Render Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.08 + 4;
        sw.alpha -= 0.025;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = sw.width * (1 - sw.radius / sw.maxRadius);
        ctx.shadowBlur = 15;
        ctx.shadowColor = sw.color;
        ctx.stroke();
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      triggerShockwaveRef.current = null;
    };
  }, [triggerShockwaveRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
