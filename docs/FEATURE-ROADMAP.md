# 🎮 NEON MARBLE - Feature Roadmap & Game Design Document

> **Tài liệu này chứa các tính năng đề xuất để tăng retention, engagement và tạo hook cho người chơi.**
> 
> Last Updated: December 28, 2025

---

## 📊 Progress Tracker

### Phase 1: Core Hooks (Target: 1-2 tuần)

| Feature | Status | Priority | Assignee | Notes |
|---------|--------|----------|----------|-------|
| XP & Leveling System | ⬜ Todo | 🔴 High | | |
| Daily Login Rewards | ⬜ Todo | 🔴 High | | |
| Basic Achievements (10 achievements) | ⬜ Todo | 🔴 High | | |
| Sound Effects | ⬜ Todo | 🔴 High | | |
| Win/Lose Animations | ⬜ Todo | 🔴 High | | |
| Screen Shake | ⬜ Todo | 🔴 High | | |
| Basic Particle System | ⬜ Todo | 🔴 High | | |
| Win Streak Counter | ⬜ Todo | 🔴 High | | |

### Phase 2: Social Features (Target: 2-3 tuần)

| Feature | Status | Priority | Assignee | Notes |
|---------|--------|----------|----------|-------|
| Global Leaderboard | ⬜ Todo | 🟡 Medium | | |
| Weekly Leaderboard | ⬜ Todo | 🟡 Medium | | |
| Friend System | ⬜ Todo | 🟡 Medium | | |
| Share Results | ⬜ Todo | 🟡 Medium | | |
| Spectator Mode | ⬜ Todo | 🟡 Medium | | |
| Challenge Friends | ⬜ Todo | 🟡 Medium | | |

### Phase 3: Content Expansion (Target: 3-4 tuần)

| Feature | Status | Priority | Assignee | Notes |
|---------|--------|----------|----------|-------|
| Ice Rink Map | ⬜ Todo | 🟢 Medium | | Low friction |
| Volcano Map | ⬜ Todo | 🟢 Medium | | Hot zones |
| Space Station Map | ⬜ Todo | 🟢 Medium | | Variable gravity |
| 10 Unlockable Skins | ⬜ Todo | 🟢 Medium | | |
| Moving Obstacles | ⬜ Todo | 🟢 Medium | | |
| Teleporters | ⬜ Todo | 🟢 Medium | | |
| Speed Pads | ⬜ Todo | 🟢 Medium | | |
| Time Attack Mode | ⬜ Todo | 🟢 Medium | | |

### Phase 4: Polish & Advanced (Ongoing)

| Feature | Status | Priority | Assignee | Notes |
|---------|--------|----------|----------|-------|
| Replay System | ⬜ Todo | 🔵 Low | | |
| Battle Pass | ⬜ Todo | 🔵 Low | | |
| Tournament Mode | ⬜ Todo | 🔵 Low | | |
| Ranked Mode | ⬜ Todo | 🔵 Low | | |
| 4-Player Mode | ⬜ Todo | 🔵 Low | | |
| Anti-Cheat System | ⬜ Todo | 🔵 Low | | |

### Status Legend
- ⬜ Todo
- 🟨 In Progress  
- ✅ Done
- ❌ Cancelled

---

## 📈 Current Game Analysis

### Strengths ✅

| Aspect | Details |
|--------|---------|
| Tech Stack | React + TypeScript + Cloudflare Workers |
| Multiplayer | Local + Online support |
| Mobile-Optimized | PWA, Joystick, Responsive |
| Physics | Realistic collision, friction, bounce |
| Camera System | Smart boundary zone detection |

### Areas for Improvement 🎯

| Area | Current State | Target State |
|------|---------------|--------------|
| Progression | None | Full XP/Level system |
| Retention | Low (no hooks) | Daily active players |
| Content | 1 map | 6+ maps with unique mechanics |
| Social | Basic multiplayer | Leaderboards, friends, sharing |
| Polish | Functional | Juicy, satisfying feedback |

---

## 1. 🏆 Progression System

### 1.1 XP & Leveling

```typescript
// src/types/progression.ts

export interface PlayerProgress {
  id: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalWins: number;
  totalGames: number;
  winStreak: number;
  longestWinStreak: number;
  unlockedSkins: string[];
  unlockedMaps: string[];
  achievements: Achievement[];
  coins: number;
  createdAt: number;
  lastPlayedAt: number;
}

// XP Calculation
export const XP_REWARDS = {
  WIN: 100,
  LOSS: 30,
  WIN_STREAK_BONUS: 20,      // Per consecutive win
  FIRST_SHOT_WIN: 50,        // Hole in one
  QUICK_WIN: 30,             // Win under 30 seconds
  COMEBACK_WIN: 40,          // Win after being behind
};

// Level thresholds (exponential)
export const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};
```

### 1.2 Unlock Progression

| Level | Unlock | Type |
|-------|--------|------|
| 1 | Default Marble | Skin |
| 3 | Blue Neon Marble | Skin |
| 5 | Ice Rink Map | Map |
| 7 | Green Laser Marble | Skin |
| 10 | Volcano Map | Map |
| 12 | Trail Effect: Sparkle | Effect |
| 15 | Purple Plasma Marble | Skin |
| 18 | Space Station Map | Map |
| 20 | Trail Effect: Fire | Effect |
| 25 | Gold Champion Marble | Skin (Rare) |
| 30 | Casino Map | Map |
| 35 | Rainbow Marble | Skin (Legendary) |
| 40 | Custom Color Unlock | Feature |
| 50 | Diamond Marble | Skin (Legendary) |

### 1.3 Implementation

```typescript
// src/hooks/useProgression.ts

import { useState, useEffect } from 'react';
import { PlayerProgress, XP_REWARDS, getXPForLevel } from '../types/progression';

const STORAGE_KEY = 'neon_marble_progress';

export const useProgression = () => {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return createDefaultProgress();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const addXP = (amount: number) => {
    setProgress(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      let xpNeeded = getXPForLevel(prev.level);

      // Level up loop
      while (newXP >= xpNeeded) {
        newXP -= xpNeeded;
        newLevel++;
        xpNeeded = getXPForLevel(newLevel);
        // Trigger level up event/animation here
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNextLevel: xpNeeded,
      };
    });
  };

  const recordGameResult = (won: boolean, stats: GameStats) => {
    let xpGained = won ? XP_REWARDS.WIN : XP_REWARDS.LOSS;

    if (won) {
      // Streak bonus
      const newStreak = progress.winStreak + 1;
      xpGained += XP_REWARDS.WIN_STREAK_BONUS * newStreak;

      // Special bonuses
      if (stats.shots === 1) xpGained += XP_REWARDS.FIRST_SHOT_WIN;
      if (stats.duration < 30000) xpGained += XP_REWARDS.QUICK_WIN;
      if (stats.wasComeback) xpGained += XP_REWARDS.COMEBACK_WIN;

      setProgress(prev => ({
        ...prev,
        totalWins: prev.totalWins + 1,
        winStreak: newStreak,
        longestWinStreak: Math.max(prev.longestWinStreak, newStreak),
      }));
    } else {
      setProgress(prev => ({
        ...prev,
        winStreak: 0,
      }));
    }

    addXP(xpGained);

    setProgress(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      lastPlayedAt: Date.now(),
    }));

    return xpGained;
  };

  return { progress, addXP, recordGameResult };
};
```

---

## 2. 🎰 Addiction Mechanics

### 2.1 Variable Reward System

```typescript
// src/utils/rewards.ts

export interface Reward {
  type: 'skin' | 'coins' | 'xp_boost' | 'trail' | 'title';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  id: string;
  name: string;
  value?: number;
}

const REWARD_TABLE: { weight: number; reward: Partial<Reward> }[] = [
  { weight: 40, reward: { type: 'coins', rarity: 'common', value: 10 } },
  { weight: 25, reward: { type: 'coins', rarity: 'uncommon', value: 25 } },
  { weight: 15, reward: { type: 'xp_boost', rarity: 'uncommon', value: 1.5 } },
  { weight: 10, reward: { type: 'coins', rarity: 'rare', value: 50 } },
  { weight: 5, reward: { type: 'skin', rarity: 'rare' } },
  { weight: 3, reward: { type: 'trail', rarity: 'rare' } },
  { weight: 1.5, reward: { type: 'skin', rarity: 'legendary' } },
  { weight: 0.5, reward: { type: 'title', rarity: 'legendary' } },
];

export const rollReward = (): Reward => {
  const totalWeight = REWARD_TABLE.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of REWARD_TABLE) {
    roll -= entry.weight;
    if (roll <= 0) {
      return generateReward(entry.reward);
    }
  }

  return generateReward(REWARD_TABLE[0].reward);
};

// Roll sau mỗi game (có thể không được gì)
export const postGameReward = (won: boolean): Reward | null => {
  const baseChance = won ? 0.4 : 0.15; // 40% nếu thắng, 15% nếu thua

  if (Math.random() < baseChance) {
    return rollReward();
  }
  return null;
};
```

### 2.2 Daily Login Rewards

```typescript
// src/types/dailyRewards.ts

export interface DailyReward {
  day: number;
  reward: Reward;
  claimed: boolean;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, reward: { type: 'coins', value: 50, rarity: 'common' }, claimed: false },
  { day: 2, reward: { type: 'skin', id: 'blue_basic', rarity: 'common' }, claimed: false },
  { day: 3, reward: { type: 'coins', value: 100, rarity: 'uncommon' }, claimed: false },
  { day: 4, reward: { type: 'xp_boost', value: 2, rarity: 'uncommon' }, claimed: false },
  { day: 5, reward: { type: 'coins', value: 200, rarity: 'rare' }, claimed: false },
  { day: 6, reward: { type: 'skin', id: 'neon_pulse', rarity: 'rare' }, claimed: false },
  { day: 7, reward: { type: 'chest', id: 'legendary_chest', rarity: 'legendary' }, claimed: false },
];

// src/hooks/useDailyRewards.ts
export const useDailyRewards = () => {
  const [streak, setStreak] = useState(0);
  const [lastClaim, setLastClaim] = useState<number | null>(null);

  const canClaim = (): boolean => {
    if (!lastClaim) return true;
    const now = new Date();
    const last = new Date(lastClaim);
    // Reset at midnight
    return now.toDateString() !== last.toDateString();
  };

  const claim = (): DailyReward | null => {
    if (!canClaim()) return null;

    const now = Date.now();
    const daysSinceLastClaim = lastClaim 
      ? Math.floor((now - lastClaim) / (1000 * 60 * 60 * 24))
      : 0;

    // Reset streak if missed a day
    const newStreak = daysSinceLastClaim > 1 ? 1 : (streak % 7) + 1;

    setStreak(newStreak);
    setLastClaim(now);

    return DAILY_REWARDS[newStreak - 1];
  };

  return { streak, canClaim, claim, nextReward: DAILY_REWARDS[streak % 7] };
};
```

### 2.3 Soft Failure Design

```typescript
// src/components/GameOverScreen.tsx

interface GameOverProps {
  won: boolean;
  stats: GameStats;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverProps> = ({ 
  won, stats, onPlayAgain, onMainMenu 
}) => {
  const encouragingMessages = [
    "So close! Try aiming a bit more to the left",
    "Almost had it! Your angle was perfect",
    "Great effort! One more shot would've done it",
    "Unlucky! The physics were not in your favor",
    "Nearly there! Your strategy was solid",
  ];

  return (
    <div className="game-over-screen">
      {won ? (
        <div className="victory">
          <h1>🎉 VICTORY!</h1>
          <div className="confetti-animation" />
        </div>
      ) : (
        <div className="defeat">
          <h2>Good game!</h2>
          <p className="encouragement">
            {encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]}
          </p>
          {stats.closestDistance && (
            <p className="close-call">
              You were only <strong>{stats.closestDistance.toFixed(1)}px</strong> away!
            </p>
          )}
        </div>
      )}

      {/* Big, prominent Play Again button */}
      <button 
        className="play-again-btn pulse-animation"
        onClick={onPlayAgain}
        autoFocus
      >
        🔄 PLAY AGAIN
      </button>

      <button className="menu-btn" onClick={onMainMenu}>
        Main Menu
      </button>
    </div>
  );
};
```

---

## 3. 🏅 Achievement System

### 3.1 Achievement Definitions

```typescript
// src/types/achievements.ts

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  reward: Reward;
  condition: AchievementCondition;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Beginner
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first game',
    icon: '🎯',
    rarity: 'common',
    reward: { type: 'coins', value: 50 },
    condition: { type: 'wins', value: 1 },
    progress: 0,
    target: 1,
    unlocked: false,
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Play 10 games',
    icon: '🎮',
    rarity: 'common',
    reward: { type: 'coins', value: 100 },
    condition: { type: 'games_played', value: 10 },
    progress: 0,
    target: 10,
    unlocked: false,
  },

  // Intermediate
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Win 5 games in a row',
    icon: '🔥',
    rarity: 'uncommon',
    reward: { type: 'trail', id: 'fire_trail' },
    condition: { type: 'win_streak', value: 5 },
    progress: 0,
    target: 5,
    unlocked: false,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Win a game in under 30 seconds',
    icon: '⚡',
    rarity: 'uncommon',
    reward: { type: 'skin', id: 'lightning_marble' },
    condition: { type: 'quick_win', value: 30000 },
    progress: 0,
    target: 1,
    unlocked: false,
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Win with a hole-in-one',
    icon: '🎱',
    rarity: 'rare',
    reward: { type: 'title', id: 'Sharpshooter' },
    condition: { type: 'hole_in_one', value: 1 },
    progress: 0,
    target: 1,
    unlocked: false,
  },

  // Advanced
  {
    id: 'century',
    name: 'Century',
    description: 'Win 100 games',
    icon: '💯',
    rarity: 'rare',
    reward: { type: 'skin', id: 'gold_marble' },
    condition: { type: 'wins', value: 100 },
    progress: 0,
    target: 100,
    unlocked: false,
  },
  {
    id: 'trickshot_master',
    name: 'Trickshot Master',
    description: 'Win after ball bounces 5+ times',
    icon: '🎪',
    rarity: 'rare',
    reward: { type: 'title', id: 'Trickster' },
    condition: { type: 'bouncy_win', value: 5 },
    progress: 0,
    target: 1,
    unlocked: false,
  },

  // Legendary
  {
    id: 'undefeated',
    name: 'Undefeated',
    description: 'Win 10 games without losing',
    icon: '👑',
    rarity: 'legendary',
    reward: { type: 'skin', id: 'crown_marble' },
    condition: { type: 'win_streak', value: 10 },
    progress: 0,
    target: 10,
    unlocked: false,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Play 1000 games',
    icon: '🏃',
    rarity: 'legendary',
    reward: { type: 'skin', id: 'diamond_marble' },
    condition: { type: 'games_played', value: 1000 },
    progress: 0,
    target: 1000,
    unlocked: false,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get 10 hole-in-ones',
    icon: '✨',
    rarity: 'legendary',
    reward: { type: 'trail', id: 'rainbow_trail' },
    condition: { type: 'hole_in_one', value: 10 },
    progress: 0,
    target: 10,
    unlocked: false,
  },
];
```

---

## 4. 🎨 Visual Polish (Juice)

### 4.1 Screen Shake

```typescript
// src/utils/screenShake.ts

export class ScreenShake {
  private intensity: number = 0;
  private decay: number = 0.9;
  private offset: { x: number; y: number } = { x: 0, y: 0 };

  shake(intensity: number) {
    this.intensity = Math.max(this.intensity, intensity);
  }

  update(): { x: number; y: number } {
    if (this.intensity < 0.5) {
      this.intensity = 0;
      this.offset = { x: 0, y: 0 };
      return this.offset;
    }

    this.offset = {
      x: (Math.random() - 0.5) * this.intensity * 2,
      y: (Math.random() - 0.5) * this.intensity * 2,
    };

    this.intensity *= this.decay;
    return this.offset;
  }
}

// Usage in GameCanvas.tsx
const screenShake = useRef(new ScreenShake());

// On collision
const handleCollision = (velocity: number) => {
  screenShake.current.shake(velocity * 0.5);
};

// In render loop
const shakeOffset = screenShake.current.update();
ctx.translate(shakeOffset.x, shakeOffset.y);
```

### 4.2 Particle System

```typescript
// src/utils/particles.ts

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  emit(x: number, y: number, options: {
    count?: number;
    color?: string;
    spread?: number;
    speed?: number;
    size?: number;
    life?: number;
  } = {}) {
    const {
      count = 10,
      color = '#00ffff',
      spread = 360,
      speed = 5,
      size = 4,
      life = 60,
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
      const velocity = speed * (0.5 + Math.random() * 0.5);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        color,
        size: size * (0.5 + Math.random() * 0.5),
        decay: 0.98,
      });
    }
  }

  // Preset effects
  collision(x: number, y: number, color: string, velocity: number) {
    this.emit(x, y, {
      count: Math.floor(velocity * 3),
      color,
      spread: 180,
      speed: velocity * 2,
      size: 3,
      life: 30,
    });
  }

  holeIn(x: number, y: number) {
    // Explosion effect
    this.emit(x, y, {
      count: 50,
      color: '#ffff00',
      spread: 360,
      speed: 8,
      size: 6,
      life: 60,
    });
    // Sparkles
    this.emit(x, y, {
      count: 20,
      color: '#ffffff',
      spread: 360,
      speed: 3,
      size: 2,
      life: 90,
    });
  }

  trail(x: number, y: number, color: string) {
    this.emit(x, y, {
      count: 1,
      color,
      spread: 0,
      speed: 0,
      size: 2,
      life: 20,
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.decay;
      p.vy *= p.decay;
      p.vy += 0.1; // Gravity
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
```

### 4.3 Sound Manager

```typescript
// src/utils/soundManager.ts

type SoundName = 
  | 'collision'
  | 'hole_in'
  | 'shoot'
  | 'win'
  | 'lose'
  | 'level_up'
  | 'achievement'
  | 'countdown'
  | 'button_click';

class SoundManager {
  private sounds: Map<SoundName, HTMLAudioElement[]> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  async init() {
    const soundFiles: Record<SoundName, string> = {
      collision: '/sounds/collision.mp3',
      hole_in: '/sounds/hole_in.mp3',
      shoot: '/sounds/shoot.mp3',
      win: '/sounds/win.mp3',
      lose: '/sounds/lose.mp3',
      level_up: '/sounds/level_up.mp3',
      achievement: '/sounds/achievement.mp3',
      countdown: '/sounds/countdown.mp3',
      button_click: '/sounds/click.mp3',
    };

    for (const [name, path] of Object.entries(soundFiles)) {
      // Pool of 3 audio elements for overlapping sounds
      const pool = Array(3).fill(null).map(() => {
        const audio = new Audio(path);
        audio.volume = this.volume;
        return audio;
      });
      this.sounds.set(name as SoundName, pool);
    }
  }

  play(name: SoundName, options: { volume?: number; pitch?: number } = {}) {
    if (!this.enabled) return;

    const pool = this.sounds.get(name);
    if (!pool) return;

    // Find available audio element
    const audio = pool.find(a => a.paused) || pool[0];
    audio.currentTime = 0;
    audio.volume = (options.volume ?? 1) * this.volume;

    if (options.pitch) {
      audio.playbackRate = options.pitch;
    }

    audio.play().catch(() => {}); // Ignore autoplay errors
  }

  // Convenience methods
  collision(velocity: number) {
    this.play('collision', { 
      volume: Math.min(velocity / 10, 1),
      pitch: 0.8 + Math.random() * 0.4 
    });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

export const soundManager = new SoundManager();
```

---

## 5. 🗺️ Map System

### 5.1 Map Definitions

```typescript
// src/config/maps.ts

export interface GameMap {
  id: string;
  name: string;
  theme: 'neon' | 'ice' | 'volcano' | 'space' | 'casino' | 'forest';
  unlockLevel: number;
  preview: string;

  // Physics modifiers
  friction: number;        // Default: 0.98
  bounciness: number;      // Default: 0.8
  gravity?: { x: number; y: number };

  // Visual
  backgroundColor: string;
  wallColor: string;
  holeColor: string;
  ambientParticles?: ParticleConfig;

  // Obstacles
  obstacles: Obstacle[];

  // Special zones
  zones?: Zone[];
}

export const MAPS: GameMap[] = [
  {
    id: 'neon_city',
    name: 'Neon City',
    theme: 'neon',
    unlockLevel: 1,
    preview: '/maps/neon_city.png',
    friction: 0.98,
    bounciness: 0.8,
    backgroundColor: '#0a0a1a',
    wallColor: '#00ffff',
    holeColor: '#ff00ff',
    obstacles: [],
  },
  {
    id: 'ice_rink',
    name: 'Ice Rink',
    theme: 'ice',
    unlockLevel: 5,
    preview: '/maps/ice_rink.png',
    friction: 0.995,        // Very low friction - slippery!
    bounciness: 0.9,
    backgroundColor: '#1a2a3a',
    wallColor: '#88ccff',
    holeColor: '#ffffff',
    ambientParticles: {
      type: 'snow',
      count: 30,
      speed: 1,
    },
    obstacles: [],
  },
  {
    id: 'volcano',
    name: 'Volcano',
    theme: 'volcano',
    unlockLevel: 10,
    preview: '/maps/volcano.png',
    friction: 0.97,
    bounciness: 0.7,
    backgroundColor: '#1a0a0a',
    wallColor: '#ff4400',
    holeColor: '#ffaa00',
    obstacles: [],
    zones: [
      {
        type: 'damage',
        shape: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        effect: { damage: 10, interval: 500 },
      },
    ],
  },
  {
    id: 'space_station',
    name: 'Space Station',
    theme: 'space',
    unlockLevel: 18,
    preview: '/maps/space.png',
    friction: 0.99,
    bounciness: 0.95,
    gravity: { x: 0, y: 0.05 },  // Low gravity
    backgroundColor: '#000011',
    wallColor: '#8800ff',
    holeColor: '#00ff88',
    ambientParticles: {
      type: 'stars',
      count: 50,
      speed: 0.5,
    },
    obstacles: [
      {
        type: 'gravity_well',
        x: 300,
        y: 300,
        radius: 80,
        strength: 0.5,
      },
    ],
  },
  {
    id: 'casino',
    name: 'Casino Royale',
    theme: 'casino',
    unlockLevel: 30,
    preview: '/maps/casino.png',
    friction: 0.98,
    bounciness: 0.85,
    backgroundColor: '#0a1a0a',
    wallColor: '#ffcc00',
    holeColor: '#00ff00',
    obstacles: [
      { type: 'bumper', x: 150, y: 150, radius: 30, force: 1.5 },
      { type: 'bumper', x: 450, y: 150, radius: 30, force: 1.5 },
      { type: 'bumper', x: 300, y: 300, radius: 30, force: 1.5 },
      { type: 'flipper', x: 100, y: 400, angle: 30, length: 80 },
      { type: 'flipper', x: 500, y: 400, angle: -30, length: 80 },
    ],
  },
];
```

### 5.2 Obstacle Types

```typescript
// src/types/obstacles.ts

export type ObstacleType = 
  | 'static_wall'
  | 'moving_wall'
  | 'bumper'
  | 'teleporter'
  | 'speed_pad'
  | 'slow_zone'
  | 'rotating_bar'
  | 'gravity_well'
  | 'flipper';

export interface BaseObstacle {
  type: ObstacleType;
  x: number;
  y: number;
}

export interface MovingWall extends BaseObstacle {
  type: 'moving_wall';
  width: number;
  height: number;
  moveAxis: 'x' | 'y';
  moveDistance: number;
  speed: number;
}

export interface Bumper extends BaseObstacle {
  type: 'bumper';
  radius: number;
  force: number;  // Bounce multiplier
}

export interface Teleporter extends BaseObstacle {
  type: 'teleporter';
  radius: number;
  targetX: number;
  targetY: number;
  cooldown: number;
}

export interface SpeedPad extends BaseObstacle {
  type: 'speed_pad';
  width: number;
  height: number;
  angle: number;
  boost: number;
}

export interface RotatingBar extends BaseObstacle {
  type: 'rotating_bar';
  length: number;
  width: number;
  rpm: number;  // Rotations per minute
}

export interface GravityWell extends BaseObstacle {
  type: 'gravity_well';
  radius: number;
  strength: number;  // Positive = attract, negative = repel
}
```

---

## 6. 📱 Daily/Weekly Challenges

### 6.1 Challenge System

```typescript
// src/types/challenges.ts

export interface Challenge {
  id: string;
  type: 'daily' | 'weekly';
  name: string;
  description: string;
  icon: string;
  reward: Reward;
  condition: ChallengeCondition;
  progress: number;
  target: number;
  completed: boolean;
  expiresAt: number;
}

export type ChallengeCondition = 
  | { type: 'win_games'; count: number }
  | { type: 'play_games'; count: number }
  | { type: 'win_streak'; count: number }
  | { type: 'hole_in_one'; count: number }
  | { type: 'bounce_wins'; bounces: number; count: number }
  | { type: 'quick_wins'; timeMs: number; count: number }
  | { type: 'play_map'; mapId: string; count: number }
  | { type: 'use_skin'; skinId: string; count: number };

// Challenge pool for random selection
export const DAILY_CHALLENGE_POOL: Omit<Challenge, 'id' | 'progress' | 'completed' | 'expiresAt'>[] = [
  {
    type: 'daily',
    name: 'Daily Victor',
    description: 'Win 3 games today',
    icon: '🏆',
    reward: { type: 'coins', value: 100 },
    condition: { type: 'win_games', count: 3 },
    target: 3,
  },
  {
    type: 'daily',
    name: 'Active Player',
    description: 'Play 5 games today',
    icon: '🎮',
    reward: { type: 'coins', value: 75 },
    condition: { type: 'play_games', count: 5 },
    target: 5,
  },
  {
    type: 'daily',
    name: 'Hot Streak',
    description: 'Win 3 games in a row',
    icon: '🔥',
    reward: { type: 'xp_boost', value: 2 },
    condition: { type: 'win_streak', count: 3 },
    target: 3,
  },
  {
    type: 'daily',
    name: 'Precision',
    description: 'Score a hole-in-one',
    icon: '🎯',
    reward: { type: 'coins', value: 150 },
    condition: { type: 'hole_in_one', count: 1 },
    target: 1,
  },
  {
    type: 'daily',
    name: 'Speed Runner',
    description: 'Win 2 games in under 30 seconds',
    icon: '⚡',
    reward: { type: 'coins', value: 120 },
    condition: { type: 'quick_wins', timeMs: 30000, count: 2 },
    target: 2,
  },
];

export const WEEKLY_CHALLENGE_POOL: Omit<Challenge, 'id' | 'progress' | 'completed' | 'expiresAt'>[] = [
  {
    type: 'weekly',
    name: 'Champion',
    description: 'Win 20 games this week',
    icon: '👑',
    reward: { type: 'skin', id: 'weekly_exclusive' },
    condition: { type: 'win_games', count: 20 },
    target: 20,
  },
  {
    type: 'weekly',
    name: 'Dedicated',
    description: 'Play 50 games this week',
    icon: '💪',
    reward: { type: 'coins', value: 500 },
    condition: { type: 'play_games', count: 50 },
    target: 50,
  },
  {
    type: 'weekly',
    name: 'Untouchable',
    description: 'Achieve a 7-win streak',
    icon: '⭐',
    reward: { type: 'trail', id: 'star_trail' },
    condition: { type: 'win_streak', count: 7 },
    target: 7,
  },
];
```

---

## 7. 🏆 Leaderboard System

### 7.1 Leaderboard Types

```typescript
// src/types/leaderboard.ts

export interface LeaderboardEntry {
  rank: number;
  oderId: string;
  playerId: string;
  playerName: string;
  playerSkin: string;
  score: number;
  wins: number;
  winRate: number;
  longestStreak: number;
  updatedAt: number;
}

export interface Leaderboards {
  global: {
    allTime: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
    weekly: LeaderboardEntry[];
    daily: LeaderboardEntry[];
  };
  friends: LeaderboardEntry[];
}

// Worker endpoint for leaderboards
// worker/src/leaderboard.ts

export class LeaderboardDO {
  private storage: DurableObjectStorage;

  async getLeaderboard(type: string, limit: number = 100): Promise<LeaderboardEntry[]> {
    const entries = await this.storage.list<LeaderboardEntry>({
      prefix: `${type}:`,
      limit,
    });

    return Array.from(entries.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  async updateScore(type: string, playerId: string, data: Partial<LeaderboardEntry>): Promise<void> {
    const key = `${type}:${playerId}`;
    const existing = await this.storage.get<LeaderboardEntry>(key);

    await this.storage.put(key, {
      ...existing,
      ...data,
      playerId,
      updatedAt: Date.now(),
    });
  }

  async getPlayerRank(type: string, playerId: string): Promise<number | null> {
    const leaderboard = await this.getLeaderboard(type, 10000);
    const entry = leaderboard.find(e => e.playerId === playerId);
    return entry?.rank ?? null;
  }
}
```

---

## 8. 📁 Suggested File Structure

```
neon-orbit/
├── worker/
│   ├── src/
│   │   ├── index.ts
│   │   ├── game-room.ts
│   │   ├── leaderboard.ts          # NEW
│   │   └── player-data.ts          # NEW
│   └── wrangler.toml
├── src/
│   ├── components/
│   │   ├── GameCanvas.tsx
│   │   ├── Joystick.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── GameOverScreen.tsx      # NEW
│   │   ├── ProgressBar.tsx         # NEW
│   │   ├── AchievementPopup.tsx    # NEW
│   │   ├── DailyRewards.tsx        # NEW
│   │   ├── Leaderboard.tsx         # NEW
│   │   ├── ChallengeList.tsx       # NEW
│   │   ├── SkinSelector.tsx        # NEW
│   │   ├── MapSelector.tsx         # NEW
│   │   └── Settings.tsx            # NEW
│   ├── config/
│   │   ├── gameConfig.ts
│   │   ├── maps.ts                 # NEW
│   │   ├── skins.ts                # NEW
│   │   └── achievements.ts         # NEW
│   ├── hooks/
│   │   ├── useMultiplayer.ts
│   │   ├── useProgression.ts       # NEW
│   │   ├── useDailyRewards.ts      # NEW
│   │   ├── useAchievements.ts      # NEW
│   │   ├── useChallenges.ts        # NEW
│   │   └── useSound.ts             # NEW
│   ├── types/
│   │   ├── game.ts
│   │   ├── progression.ts          # NEW
│   │   ├── achievements.ts         # NEW
│   │   ├── challenges.ts           # NEW
│   │   ├── leaderboard.ts          # NEW
│   │   └── obstacles.ts            # NEW
│   └── utils/
│       ├── physics.ts
│       ├── mapGenerator.ts
│       ├── particles.ts            # NEW
│       ├── screenShake.ts          # NEW
│       ├── soundManager.ts         # NEW
│       └── rewards.ts              # NEW
├── public/
│   ├── sounds/                     # NEW
│   │   ├── collision.mp3
│   │   ├── hole_in.mp3
│   │   ├── shoot.mp3
│   │   ├── win.mp3
│   │   ├── lose.mp3
│   │   └── ...
│   ├── maps/                       # NEW
│   │   ├── neon_city.png
│   │   ├── ice_rink.png
│   │   └── ...
│   └── skins/                      # NEW
│       ├── default.png
│       ├── blue_neon.png
│       └── ...
├── docs/
│   ├── DEPLOYMENT.md
│   ├── CAMERA-BOUNDARY-ZONE.md
│   └── FEATURE-ROADMAP.md          # THIS FILE
└── package.json
```

---

## 9. 🚀 Quick Wins (Implement Today)

### Priority 1: Screen Shake (30 mins)

Add to `GameCanvas.tsx`:

```typescript
// Add at top of component
const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
const shakeIntensity = useRef(0);

const triggerShake = (intensity: number) => {
  shakeIntensity.current = Math.max(shakeIntensity.current, intensity);
};

// In animation loop
useEffect(() => {
  const animate = () => {
    if (shakeIntensity.current > 0.5) {
      setShakeOffset({
        x: (Math.random() - 0.5) * shakeIntensity.current * 2,
        y: (Math.random() - 0.5) * shakeIntensity.current * 2,
      });
      shakeIntensity.current *= 0.9;
    } else {
      setShakeOffset({ x: 0, y: 0 });
    }
    requestAnimationFrame(animate);
  };
  animate();
}, []);

// Apply to canvas transform
<canvas 
  style={{ 
    transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)` 
  }}
/>
```

### Priority 2: Win Streak Counter (15 mins)

```typescript
// src/hooks/useWinStreak.ts
export const useWinStreak = () => {
  const [streak, setStreak] = useState(() => 
    parseInt(localStorage.getItem('winStreak') || '0')
  );

  const recordWin = () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('winStreak', String(newStreak));
    return newStreak;
  };

  const recordLoss = () => {
    setStreak(0);
    localStorage.setItem('winStreak', '0');
  };

  return { streak, recordWin, recordLoss };
};
```

### Priority 3: Satisfying Win Animation (1 hour)

```typescript
// Add confetti effect on win
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="confetti-container">
      {Array(50).fill(0).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            backgroundColor: ['#ff0', '#0ff', '#f0f', '#0f0'][i % 4],
          }}
        />
      ))}
    </div>
  );
};

// CSS
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confetti-fall 3s ease-out forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
```

---

## 📝 Notes

- Tất cả features có thể implement progressively
- Start với Phase 1 để thấy improvement ngay lập tức
- Test với users thật để validate assumptions
- Monitor metrics: DAU, retention, session length

---

## 📚 Resources

- [Game Feel - Juice It or Lose It](https://www.youtube.com/watch?v=Fy0aCDmgnxg)
- [Designing for Player Retention](https://gamedesignskills.com/game-design/player-retention/)
- [What Makes Hyper-Casual Games Addictive](https://dev.to/krishanvijay/what-makes-hyper-casual-games-so-addictive-24me)

---

*Document created: December 28, 2025*
*Version: 1.0.0*
