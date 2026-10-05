import React, { useRef, useState } from 'react';

interface AccelerationButtonProps {
  combo: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => void;
  tierColor: string;
}

export const AccelerationButton: React.FC<AccelerationButtonProps> = ({ combo, onClick, tierColor }) => {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const getSubStatus = (c: number) => {
    if (c >= 25) return 'КВАНТОВЫЙ РАЗГОН ⚡';
    if (c >= 15) return 'ВАРП-СКОРОСТЬ 🚀';
    if (c >= 10) return 'СВЕТОВАЯ СКОРОСТЬ 💫';
    if (c >= 6) return 'ГИПЕР-ДРАЙВ 🔥';
    if (c >= 3) return 'ТУРБО-РЕЖИМ ⚡';
    if (c >= 2) return 'УСКОРЯЕМСЯ! 💨';
    return 'ЖМИ ЧАЩЕ!';
  };

  // Rotation speed calculation based on combo
  const spinDuration = Math.max(0.6, 6 / Math.max(1, combo * 0.7));

  return (
    <div className="button-wrapper">
      {/* Outer cybernetic rotating rings */}
      <div
        className="ring ring-outer"
        style={{
          borderColor: `${tierColor}44`,
          borderTopColor: tierColor,
          borderBottomColor: tierColor,
          animationDuration: `${spinDuration}s`,
          boxShadow: `0 0 25px ${tierColor}40`,
        }}
      />
      <div
        className="ring ring-middle"
        style={{
          borderColor: `${tierColor}33`,
          borderLeftColor: tierColor,
          borderRightColor: tierColor,
          animationDuration: `${spinDuration * 1.5}s`,
          animationDirection: 'reverse',
        }}
      />
      <div
        className="ring ring-inner"
        style={{
          borderColor: `${tierColor}55`,
          animationDuration: `${spinDuration * 0.8}s`,
        }}
      />

      {/* Pulsing ambient aura */}
      <div
        className="button-aura"
        style={{
          background: `radial-gradient(circle, ${tierColor}55 0%, transparent 70%)`,
          transform: `scale(${1 + Math.min(combo * 0.05, 0.6)})`,
        }}
      />

      {/* Main interactive button */}
      <button
        ref={buttonRef}
        className={`accel-button ${isPressed ? 'pressed' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          borderColor: tierColor,
          boxShadow: `0 0 ${20 + Math.min(combo * 3, 50)}px ${tierColor}88, inset 0 0 20px ${tierColor}44`,
        }}
      >
        <div className="button-inner-glow" style={{ background: `radial-gradient(circle, ${tierColor}33 0%, transparent 80%)` }} />

        <div className="button-icon-wrapper">
          <svg className="lightning-icon" viewBox="0 0 24 24" fill={tierColor}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        <div className="button-title">УСКОРИТЬ</div>
        <div className="button-sub" style={{ color: tierColor }}>
          {getSubStatus(combo)}
        </div>

        <div className="button-combo-tag" style={{ background: tierColor }}>
          x{combo}
        </div>
      </button>
    </div>
  );
};
