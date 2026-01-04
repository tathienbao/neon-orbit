# Retention System Roadmap

## Status: Planning

---

## Current Problems

### 1. Visual Design Issues
- Colors are inconsistent across UI elements
- Too many colors on objects causing visual confusion
- Size, position, and spacing inconsistent between elements
- Obstacles/decorations more saturated than marbles (should be opposite)
- Overall aesthetic feels "childish" rather than sleek neon

### 2. UX Issues
- No indication of Goal location when game starts
- Missing onboarding/tutorial hints

### 3. No Retention Mechanics
- No progression system
- No rewards for returning
- No achievements or challenges

---

## Planned Features

### Phase 1: Core Progression

#### XP & Leveling
- Earn XP from wins, achievements, daily play
- Level up to unlock cosmetics
- Visual level badge next to player name

#### Daily Login Rewards (7-day streak)
| Day | Reward |
|-----|--------|
| 1 | 50 XP |
| 2 | 100 XP |
| 3 | Random skin |
| 4 | 200 XP |
| 5 | Trail effect |
| 6 | 300 XP |
| 7 | Premium skin + 500 XP |

Missing a day resets streak to Day 1.

---

### Phase 2: Achievements

#### 10 Core Achievements
| Achievement | Condition | Reward |
|-------------|-----------|--------|
| First Blood | Win first game | 100 XP |
| Sharpshooter | Win in 3 shots | 200 XP |
| Comeback Kid | Win after being 2 goals down | 300 XP |
| Speedrunner | Win in under 60 seconds | 250 XP |
| Perfectionist | Win without opponent scoring | 400 XP |
| Veteran | Play 50 games | Trail unlock |
| Champion | Win 25 games | Skin unlock |
| Streak Master | 5 win streak | 500 XP |
| Social Butterfly | Play 10 online games | 200 XP |
| Explorer | Play all 5 maps | Map-themed skin |

---

### Phase 3: Variable Rewards & Challenges

#### Daily Challenges (reset 00:00 UTC)
- "Win 2 games" → 150 XP
- "Score 5 goals" → 100 XP
- "Play on Ice map" → 75 XP

#### Weekly Challenges
- "Win 10 games" → Exclusive trail
- "Complete all daily challenges" → 1000 XP

#### Variable Reward Mechanics
- Random bonus XP multiplier (1x-3x) after wins
- Mystery box every 5 levels
- Chance for rare cosmetic drops

---

### Phase 4: Leaderboards

#### Global Leaderboard
- All-time wins ranking
- Total XP ranking

#### Weekly Leaderboard
- Resets every Monday
- Top 10 get bonus rewards

#### Daily Leaderboard
- Resets at 00:00 UTC
- Encourages daily engagement

---

### Phase 5: Juice & Polish

#### Screen Shake
- On goal scored
- On marble collision
- Intensity based on velocity

#### Particle Effects
- Goal explosion particles
- Marble trail particles
- Win celebration confetti

#### Sound System
- Marble rolling sound
- Collision SFX
- Goal scored fanfare
- Background music (toggleable)
- UI click sounds

---

### Phase 6: Maps & Obstacles

#### 5 Themed Maps

| Map | Theme | Special Feature |
|-----|-------|-----------------|
| Classic | Neon | Standard play |
| Ice | Frozen | Slippery surfaces |
| Volcano | Lava | Danger zones |
| Space | Zero-G | Low friction |
| Casino | Luck | Random bumpers |
| Forest | Nature | Organic obstacles |

#### Dynamic Obstacles

| Obstacle | Behavior |
|----------|----------|
| Bumpers | Bounce marble with force |
| Teleporters | Warp to paired teleporter |
| Speed Pads | Boost marble velocity |
| Sticky Zones | Slow down marble |
| Rotating Walls | Moving barriers |

---

### Phase 7: Soft Failure & Retention

#### Win Streak Tracking
- Display current streak
- Streak rewards at 3, 5, 10 wins
- "Streak protected" item (1 loss forgiven)

#### Soft Failure UX
- "Almost!" message on close losses
- Show improvement stats ("You scored 1 more goal than last game!")
- Rematch button prominent
- "Practice mode" suggestion after losses

#### Loss Recovery
- Bonus XP for first win after losing streak
- "Comeback bonus" mechanic

---

### Phase 8: Cosmetics

#### Unlockable Skins
- Color variants (earned through levels)
- Pattern skins (achievements)
- Animated skins (premium/rare drops)

#### Trail Effects
- None (default)
- Neon glow
- Fire trail
- Ice crystals
- Sparkles
- Rainbow

---

## Implementation Priority

1. **High Priority (Core Loop)**
   - Visual design cleanup
   - Goal indicator on game start
   - XP system
   - Basic achievements

2. **Medium Priority (Engagement)**
   - Daily login rewards
   - Daily challenges
   - Leaderboards
   - Screen shake & particles

3. **Lower Priority (Content)**
   - Multiple maps
   - Dynamic obstacles
   - Sound system
   - Advanced cosmetics

---

## Technical Notes

### Data Storage
- LocalStorage for offline progress
- Cloudflare KV for online leaderboards
- Durable Objects for real-time sync

### State Structure
```typescript
interface PlayerProgress {
  xp: number;
  level: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  achievements: string[];
  unlockedSkins: string[];
  unlockedTrails: string[];
  dailyLoginStreak: number;
  lastLoginDate: string;
  dailyChallenges: DailyChallenge[];
}
```

---

## References

- [Hooked: How to Build Habit-Forming Products](https://www.nirandfar.com/hooked/)
- [Game Design: Variable Ratio Reinforcement](https://www.gamedeveloper.com/design/behavioral-game-design)
