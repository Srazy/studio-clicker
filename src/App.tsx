import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { WarpCanvas } from './components/WarpCanvas';
import { FloatingItems } from './components/FloatingItems';
import { AccelerationButton } from './components/AccelerationButton';
import type { FloatingTextItem, ComboTier, EmployeeType, EmployeeInfo, PerkInfo } from './types';
import { sounds } from './utils/audio';

const COMBO_TIMEOUT = 1200; // ms to reset combo
const MONEY_DROP_INTERVAL = 30000; // 30 seconds (half a minute)
const ACCEL_DECAY_RATE = 2; // % per second
const MAX_ACCEL = 100;

const TIERS: ComboTier[] = [
  { multiplier: 1, title: 'ДЖУН', color: '#38bdf8', particleSpeed: 2, badge: '💻' },
  { multiplier: 2, title: 'МИДЛ', color: '#00f0ff', particleSpeed: 5, badge: '⚡' },
  { multiplier: 4, title: 'СЕНЬОР', color: '#c084fc', particleSpeed: 12, badge: '🔥' },
  { multiplier: 8, title: 'ЛИД', color: '#ff9900', particleSpeed: 25, badge: '💫' },
  { multiplier: 16, title: 'АРХИТЕКТОР', color: '#ff0055', particleSpeed: 45, badge: '🚀' },
  { multiplier: 32, title: 'СТО', color: '#ffffff', particleSpeed: 70, badge: '👑' },
];

const EMPLOYEES: EmployeeInfo[] = [
  { type: 'developer', label: 'Разработчик', baseCost: 100, description: 'Пишет больше строк за клик.', icon: '👨‍💻' },
  { type: 'analyst', label: 'Аналитик', baseCost: 250, description: 'Увеличивает доход с продукта.', icon: '📊' },
  { type: 'backend', label: 'Бэкендер', baseCost: 500, description: 'Стабилизирует ускорение.', icon: '⚙️' },
  { type: 'manager', label: 'Менеджер', baseCost: 1000, description: 'Автоматически пишет код.', icon: '👔' },
];

const PERKS: PerkInfo[] = [
  { id: 'diploma', label: 'Почетная грамота', baseCost: 1500, description: 'Множитель строк x1.5 навсегда.', icon: '📜' },
  { id: 'thanks', label: 'Бесплатное "Спасибо"', baseCost: 0, description: 'Ничего не стоит, но поднимает мораль.', icon: '🙏', free: true },
  { id: 'pizza', label: 'Пицца для команды', baseCost: 500, description: 'Удваивает строки на 30 секунд.', icon: '🍕' },
  { id: 'energy', label: 'Энергетик', baseCost: 300, description: 'Мгновенный рывок ускорения (+35%).', icon: '⚡' },
  { id: 'cookies', label: 'Печеньки в офисе', baseCost: 200, description: 'Увеличивает доход аналитиков.', icon: '🍪' },
  { id: 'sysadmin', label: 'Сисадмин', baseCost: 800, description: 'Снижает штраф от выгорания.', icon: '🛡️' },
];

export default function App() {
  const [linesOfCode, setLinesOfCode] = useState(0);
  const [money, setMoney] = useState(0);
  const [acceleration, setAcceleration] = useState(0);
  const [moneyTimer, setMoneyTimer] = useState(MONEY_DROP_INTERVAL);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [floatingItems, setFloatingItems] = useState<FloatingTextItem[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [activeShop, setActiveShop] = useState<'staff' | 'perks'>('staff');

  const [employees, setEmployees] = useState<Record<EmployeeType, number>>({
    developer: 0,
    analyst: 0,
    backend: 0,
    manager: 0,
  });

  const [hasDiploma, setHasDiploma] = useState(false);
  const [pizzaBoost, setPizzaBoost] = useState(0); // seconds
  const [cookiesBoost, setCookiesBoost] = useState(false);
  const [sysadminActive, setSysadminActive] = useState(false);

  const comboTimerRef = useRef<number | null>(null);
  const triggerShockwaveRef = useRef<((x?: number, y?: number, color?: string) => void) | null>(null);

  // Acceleration decay, automation & timers
  useEffect(() => {
    const timer = setInterval(() => {
      const sysadminReduction = sysadminActive ? 0.5 : 0;
      setAcceleration(prev => Math.max(0, prev - (ACCEL_DECAY_RATE - employees.backend * 0.1 - sysadminReduction)));
      
      // Managers write code automatically
      if (employees.manager > 0) {
        setLinesOfCode(prev => prev + employees.manager * 2);
      }
      
      // Pizza boost decay
      setPizzaBoost(prev => Math.max(0, prev - 1));

      // Money drop timer countdown (ms)
      setMoneyTimer(prev => {
        if (prev <= 1000) {
          // Trigger money drop
          const cookieBonus = cookiesBoost ? 20 : 0;
          const baseMoney = 50 + employees.analyst * 25 + cookieBonus;
          
          // Penalty for max acceleration: if acceleration > 80%, money gain drops
          const penalty = acceleration > 80 ? (sysadminActive ? 0.7 : 0.4) : 1.0;
          const finalMoney = Math.floor(baseMoney * penalty);
          
          setMoney(m => m + finalMoney);
          
          const id = Date.now();
          const moneyItem: FloatingTextItem = {
            id,
            text: `+$${finalMoney} (Доход)`,
            x: window.innerWidth / 2,
            y: 120,
            scale: 1.4,
            color: '#22c55e',
            type: 'money',
          };
          setFloatingItems(fi => [...fi, moneyItem]);
          setTimeout(() => {
            setFloatingItems(fi => fi.filter(i => i.id !== id));
          }, 2000);

          if (isAudioEnabled) sounds.playComboUp(1);

          return MONEY_DROP_INTERVAL;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [employees.backend, employees.manager, employees.analyst, acceleration, cookiesBoost, sysadminActive, isAudioEnabled]);

  const getCurrentTier = useCallback((c: number): ComboTier => {
    if (c >= 40) return TIERS[5];
    if (c >= 25) return TIERS[4];
    if (c >= 15) return TIERS[3];
    if (c >= 8) return TIERS[2];
    if (c >= 3) return TIERS[1];
    return TIERS[0];
  }, []);

  const currentTier = getCurrentTier(combo);

  const resetCombo = useCallback(() => {
    if (combo > 0 && isAudioEnabled) {
      sounds.playDrop();
    }
    setCombo(0);
  }, [combo, isAudioEnabled]);

  const handleInteract = useCallback((e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
    const newCombo = combo + 1;
    const tier = getCurrentTier(newCombo);
    const prevTier = getCurrentTier(combo);

    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);

    // Increase acceleration
    setAcceleration(prev => Math.min(MAX_ACCEL, prev + 2.5));

    // LoC logic: base 1 + devs + accel bonus + diploma boost + pizza boost
    const accelBonus = acceleration / 8;
    const pizzaMultiplier = pizzaBoost > 0 ? 2 : 1;
    const diplomaMultiplier = hasDiploma ? 1.5 : 1;
    const pointsToAdd = Math.floor((1 + employees.developer * 6 + accelBonus) * tier.multiplier * diplomaMultiplier * pizzaMultiplier);
    
    setLinesOfCode((prev) => prev + pointsToAdd);

    // Audio
    if (isAudioEnabled) {
      if (tier.multiplier > prevTier.multiplier) {
        sounds.playComboUp(newCombo);
      } else {
        sounds.playClick(newCombo);
      }
    }

    // Visuals
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;
    if (e && 'clientX' in e) { clientX = e.clientX; clientY = e.clientY; }

    const id = Date.now();
    const newItem: FloatingTextItem = {
      id,
      text: `+${pointsToAdd} строк`,
      x: clientX + (Math.random() - 0.5) * 40,
      y: clientY - 20,
      scale: 0.8 + Math.min(newCombo * 0.05, 1.2),
      color: tier.color,
      type: 'point',
      angle: (Math.random() - 0.5) * 20,
    };

    setFloatingItems((prev) => [...prev.slice(-30), newItem]);

    if (newCombo % 5 === 0 || newCombo === 1) {
      const isMega = newCombo % 10 === 0 && newCombo > 0;
      const comboItem: FloatingTextItem = {
        id: id + 1,
        text: `x${newCombo} КОММИТ`,
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 200) + 100,
        scale: isMega ? 1.5 : 1,
        color: tier.color,
        type: isMega ? 'mega-combo' : 'combo',
        angle: (Math.random() - 0.5) * 15,
      };
      setFloatingItems((prev) => [...prev, comboItem]);
      if (triggerShockwaveRef.current) triggerShockwaveRef.current(clientX, clientY, isMega ? tier.color : undefined);
    }

    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((i) => i.id !== id && i.id !== id + 1));
    }, 1600);

    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    comboTimerRef.current = window.setTimeout(resetCombo, COMBO_TIMEOUT);
  }, [combo, maxCombo, acceleration, pizzaBoost, hasDiploma, employees, getCurrentTier, resetCombo, isAudioEnabled]);

  const hireEmployee = useCallback((type: EmployeeType) => {
    const info = EMPLOYEES.find(e => e.type === type)!;
    const cost = Math.floor(info.baseCost * Math.pow(1.15, employees[type]));
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setEmployees(prev => ({ ...prev, [type]: prev[type] + 1 }));
    }
  }, [employees, money]);

  const buyPerk = useCallback((perkId: string) => {
    if (perkId === 'thanks') {
      const id = Date.now();
      setFloatingItems(prev => [...prev, {
        id, text: '🎉 КОМАНДА ГОВОРИТ СПАСИБО!', x: window.innerWidth / 2, y: window.innerHeight / 3,
        scale: 1.6, color: '#fcd34d', type: 'mega-combo'
      }]);
      setTimeout(() => setFloatingItems(prev => prev.filter(i => i.id !== id)), 2000);
      return;
    }

    const perk = PERKS.find(p => p.id === perkId);
    if (!perk) return;

    if (money >= perk.baseCost) {
      let msg = '';
      if (perkId === 'diploma' && !hasDiploma) {
        setMoney(prev => prev - perk.baseCost);
        setHasDiploma(true);
        msg = '📜 ПОЧЕТНАЯ ГРАМОТА ВРУЧЕНА! (x1.5)';
      } else if (perkId === 'pizza') {
        setMoney(prev => prev - perk.baseCost);
        setPizzaBoost(30);
        msg = '🍕 ПИЦЦА ДОСТАВЛЕНА В ОФИС!';
      } else if (perkId === 'energy') {
        setMoney(prev => prev - perk.baseCost);
        setAcceleration(prev => Math.min(MAX_ACCEL, prev + 35));
        msg = '⚡ ЭНЕРГЕТИК ВЫПИТ! РЫВОК!';
      } else if (perkId === 'cookies') {
        setMoney(prev => prev - perk.baseCost);
        setCookiesBoost(true);
        msg = '🍪 ПЕЧЕНЬКИ СЪЕДЕНЫ! ДОХОД РАСТЕТ!';
      } else if (perkId === 'sysadmin') {
        setMoney(prev => prev - perk.baseCost);
        setSysadminActive(true);
        msg = '🛡️ СИСАДМИН НА СВЯЗИ!';
      }

      if (msg) {
        const id = Date.now();
        setFloatingItems(prev => [...prev, {
          id, text: msg, x: window.innerWidth / 2, y: window.innerHeight / 3,
          scale: 1.6, color: '#38bdf8', type: 'mega-combo'
        }]);
        setTimeout(() => setFloatingItems(prev => prev.filter(i => i.id !== id)), 2000);
      }
    }
  }, [money, hasDiploma]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) handleInteract(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combo, handleInteract]);

  return (
    <div className="clicker-app">
      <WarpCanvas combo={combo} triggerShockwaveRef={triggerShockwaveRef} />
      <div className="app-overlay" />
      <FloatingItems items={floatingItems} />

      <header className="hud-header">
        <div className="top-bar">
          <div className="app-branding">
            <span className="logo-badge">DEV-CORE</span>
            <h1 className="app-title">STUDIO CLICKER</h1>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => setIsAudioEnabled(!isAudioEnabled)}>
              {isAudioEnabled ? '🔊 ЗВУК ВКЛ' : '🔇 БЕЗ ЗВУКА'}
            </button>
            <button className="icon-btn" onClick={() => { setLinesOfCode(0); setMoney(0); setEmployees({developer:0, analyst:0, backend:0, manager:0}); setHasDiploma(false); setPizzaBoost(0); setSysadminActive(false); }}>СБРОС</button>
          </div>
        </div>

        {/* Stats Dashboard with Gauges */}
        <div className="stats-grid">
          {/* LoC Gauge */}
          <div className="stat-card highlight">
            <div className="stat-header-row">
              <span className="stat-label">Строки кода (LoC)</span>
              <span className="stat-badge">📝</span>
            </div>
            <div className="stat-value">{linesOfCode.toLocaleString()} <span className="stat-unit">строк</span></div>
            <div className="mini-gauge-track">
              <div className="mini-gauge-fill" style={{ width: `${Math.min(100, (linesOfCode % 1000) / 10)}%`, background: currentTier.color }} />
            </div>
          </div>

          {/* Money / Product Revenue Gauge */}
          <div className="stat-card money-card">
            <div className="stat-header-row">
              <span className="stat-label">Доход продукта</span>
              <span className="stat-badge">💰</span>
            </div>
            <div className="stat-value" style={{ color: '#22c55e' }}>${money.toLocaleString()}</div>
            <div className="mini-gauge-track">
              <div className="mini-gauge-fill" style={{ width: `${Math.min(100, (moneyTimer / MONEY_DROP_INTERVAL) * 100)}%`, background: '#22c55e' }} />
            </div>
            <span className="timer-subtext">Выплата через {Math.ceil(moneyTimer / 1000)}с</span>
          </div>

          {/* Acceleration Gauge */}
          <div className="stat-card accel-card">
            <div className="stat-header-row">
              <span className="stat-label">Ускорение команды</span>
              <span className="stat-badge">⚡</span>
            </div>
            <div className="stat-value" style={{ color: acceleration > 80 ? '#ef4444' : '#38bdf8' }}>
              {Math.floor(acceleration)}%
              {acceleration > 80 && <span className="burnout-warning">🔥 ВЫГОРАНИЕ</span>}
            </div>
            <div className="mini-gauge-track">
              <div className="mini-gauge-fill" style={{ width: `${acceleration}%`, background: acceleration > 80 ? '#ef4444' : '#38bdf8' }} />
            </div>
          </div>

          {/* Team Morale / Buffs */}
          <div className="stat-card pizza-card">
            <div className="stat-header-row">
              <span className="stat-label">Мораль и Буффы</span>
              <span className="stat-badge">☕</span>
            </div>
            <div className="stat-value" style={{ fontSize: '15px' }}>
              {pizzaBoost > 0 ? `🍕 ПИЦЦА (${pizzaBoost}с)` : hasDiploma ? '📜 ДИПЛОМ x1.5' : sysadminActive ? '🛡️ СИСАДМИН' : '☕ КОФЕ-БРЕЙК'}
            </div>
            <div className="mini-gauge-track">
              <div className="mini-gauge-fill" style={{ width: pizzaBoost > 0 ? `${(pizzaBoost / 30) * 100}%` : '100%', background: '#fcd34d' }} />
            </div>
          </div>
        </div>

        <div className="combo-meter-container">
          <div className="combo-meter-info">
            <span style={{ color: currentTier.color }}>РАНГ: {currentTier.title} {currentTier.badge}</span>
            <span>{combo} КОММИТОВ ПОДРЯД</span>
          </div>
          <div className="combo-meter-track">
            <div className="combo-meter-fill" style={{ width: `${Math.min(100, (combo % 10) * 10 || (combo > 0 ? 100 : 0))}%`, backgroundColor: currentTier.color, color: currentTier.color }} />
          </div>
        </div>
      </header>

      <main className="center-stage">
        <div className="game-layout">
          {/* Shop Switcher / Separate Shops */}
          <div className="shops-container">
            <div className="shop-tabs">
              <button className={`shop-tab ${activeShop === 'staff' ? 'active' : ''}`} onClick={() => setActiveShop('staff')}>
                👨‍💻 НАЙМ СОТРУДНИКОВ
              </button>
              <button className={`shop-tab ${activeShop === 'perks' ? 'active' : ''}`} onClick={() => setActiveShop('perks')}>
                📜 ГРАМОТЫ И БОНУСЫ
              </button>
            </div>

            {activeShop === 'staff' ? (
              <section className="shop-section staff-shop animate-fade">
                <h3>КОМАНДА РАЗРАБОТКИ</h3>
                {EMPLOYEES.map(emp => {
                  const count = employees[emp.type];
                  const cost = Math.floor(emp.baseCost * Math.pow(1.15, count));
                  return (
                    <button key={emp.type} className="shop-item" onClick={() => hireEmployee(emp.type)} disabled={money < cost}>
                      <span className="shop-icon">{emp.icon}</span>
                      <div className="shop-info">
                        <span className="shop-label">{emp.label} (x{count})</span>
                        <span className="shop-desc">{emp.description}</span>
                        <span className="shop-cost">${cost.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </section>
            ) : (
              <section className="shop-section perks-shop animate-fade">
                <h3>ГРАМОТЫ И МОТИВАЦИЯ</h3>
                {PERKS.map(perk => {
                  const isBought = perk.id === 'diploma' && hasDiploma;
                  return (
                    <button key={perk.id} className="shop-item" onClick={() => buyPerk(perk.id)} disabled={money < perk.baseCost || isBought}>
                      <span className="shop-icon">{perk.icon}</span>
                      <div className="shop-info">
                        <span className="shop-label">{perk.label} {isBought && '(КУПЛЕНО)'}</span>
                        <span className="shop-desc">{perk.description}</span>
                        <span className="shop-cost">{perk.free ? 'БЕСПЛАТНО' : `$${perk.baseCost.toLocaleString()}`}</span>
                      </div>
                    </button>
                  );
                })}
              </section>
            )}
          </div>

          <div className="main-button-area">
            <AccelerationButton combo={combo} onClick={handleInteract} tierColor={currentTier.color} />
          </div>
        </div>
      </main>

      <footer className="hud-footer">
        <div className="keyboard-hint">
          <span className="kbd">SPACE</span> ЧТОБЫ КОДИТЬ | <span className="kbd">ВЫПЛАТА ЗАРПЛАТЫ РАЗ В 30 СЕК</span>
        </div>
        <div className="tier-indicator">
          {TIERS.map((t, i) => (
            <div key={i} className="tier-dot" style={{ backgroundColor: combo >= (i === 0 ? 0 : i === 1 ? 3 : i === 2 ? 8 : i === 3 ? 15 : i === 4 ? 25 : 40) ? t.color : '#2d2d3d', color: t.color }} />
          ))}
          <span>СТАТУС: СТУДИЯ АКТИВНА</span>
        </div>
      </footer>
    </div>
  );
}
