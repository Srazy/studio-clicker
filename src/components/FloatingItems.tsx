import React from 'react';
import type { FloatingTextItem } from '../types';

interface FloatingItemsProps {
  items: FloatingTextItem[];
}

export const FloatingItems: React.FC<FloatingItemsProps> = ({ items }) => {
  return (
    <div className="floating-container" aria-hidden="true">
      {items.map((item) => {
        if (item.type === 'point') {
          return (
            <div
              key={item.id}
              className="float-point"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                transform: `scale(${item.scale}) rotate(${item.angle || 0}deg)`,
                color: item.color,
                textShadow: `0 0 12px ${item.color}`,
              }}
            >
              {item.text}
            </div>
          );
        }

        if (item.type === 'mega-combo') {
          return (
            <div
              key={item.id}
              className="float-mega-combo"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                transform: `translate(-50%, -50%) rotate(${item.angle || 0}deg) scale(${item.scale})`,
                borderColor: item.color,
                color: '#ffffff',
                boxShadow: `0 0 35px ${item.color}, inset 0 0 20px ${item.color}`,
              }}
            >
              <div className="mega-combo-glow" style={{ background: item.color }} />
              <span className="mega-combo-badge">COMBO BURST</span>
              <span className="mega-combo-text" style={{ textShadow: `0 0 20px ${item.color}` }}>
                {item.text}
              </span>
            </div>
          );
        }

        // Standard background flying combo
        return (
          <div
            key={item.id}
            className="float-combo"
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              color: item.color,
              borderColor: `${item.color}88`,
              transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.angle || 0}deg)`,
              boxShadow: `0 0 25px ${item.color}66`,
            }}
          >
            <span className="combo-sparkle">✦</span>
            <span className="combo-label">{item.text}</span>
            <span className="combo-sparkle">✦</span>
          </div>
        );
      })}
    </div>
  );
};
