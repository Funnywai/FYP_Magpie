import type { Loc } from '../i18n/strings';
import type { IndoorOutdoor } from '@magpie/shared';

export type Stop = { time: string; title: string; setting: IndoorOutdoor };
export type Weather = { kind: 'sun' | 'cloud' | 'rain'; label: Loc; temp: string };
export type Day = { label: string; weather: Weather; adjusted?: boolean; stops: Stop[] };

// Three days; day 2 is the rain-adjusted one (all indoor stops).
export const mockDays: Day[] = [
  {
    label: 'Day 1',
    weather: { kind: 'sun', label: { zh: '晴', en: 'Sunny' }, temp: '29°C' },
    stops: [
      { time: '10:00–12:00', title: '深水埗老字號糖水舖', setting: 'indoor' },
      { time: '13:30–15:30', title: '旺角波鞋街', setting: 'outdoor' },
      { time: '18:30–20:30', title: '尖沙咀 Omakase 日式割烹', setting: 'indoor' },
    ],
  },
  {
    // Rain day: the planner swapped outdoor stops for indoor ones.
    label: 'Day 2',
    weather: { kind: 'rain', label: { zh: '雨', en: 'Rain' }, temp: '25°C' },
    adjusted: true,
    stops: [
      { time: '10:30–12:30', title: '銅鑼灣戲院', setting: 'indoor' },
      { time: '13:00–15:00', title: '一鍋煮雞飯（自己煮）', setting: 'indoor' },
      { time: '16:00–18:00', title: '茶餐廳奶茶下午茶', setting: 'indoor' },
    ],
  },
  {
    label: 'Day 3',
    weather: { kind: 'cloud', label: { zh: '多雲', en: 'Cloudy' }, temp: '27°C' },
    stops: [
      { time: '08:30–12:30', title: '大嶼山鳳凰徑', setting: 'outdoor' },
      { time: '13:30–15:00', title: '昂坪市集午餐', setting: 'mixed' },
      { time: '19:00–21:00', title: '10 分鐘蒜香橄欖油意粉', setting: 'indoor' },
    ],
  },
];
