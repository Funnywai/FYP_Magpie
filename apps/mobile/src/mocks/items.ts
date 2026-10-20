import type { Loc } from '../i18n/strings';
import type { ContentType, IndoorOutdoor, ItemStatus, Language, SourcePlatform, TranscriptStatus } from '@magpie/shared';

// Local UI types: the shared SavedItem needs ids/timestamps a mock does not have.
export type Field = {
  id: string;
  label: Loc;
  value: string;
  /** 0-100. */
  confidence: number;
  /** e.g. "OCR · 0:12" (rendered monospace). */
  evidence: string;
  corrected?: boolean;
};

// One transcript line; `at` is a m:ss string shown in monospace.
export type ThumbArtName = 'sushi' | 'pasta' | 'hike' | 'dessert' | 'film' | 'pot' | 'link' | 'shoe' | 'sparkle';

export type Segment = { at: string; lang: Language; text: string };

export type Item = {
  id: string;
  title: string;
  platform: SourcePlatform;
  contentType: ContentType;
  status: ItemStatus;
  transcriptStatus: TranscriptStatus;
  meta: Loc;
  url: string;
  /** Hand-drawn SVG illustration shown on the thumbnail (see ThumbArt). */
  art: ThumbArtName;
  /** Index into tokens.thumbGradients. */
  gradient: number;
  relevance: number;
  highlights: string[];
  fields: Field[];
  transcript: Segment[];
  failure?: { reason: Loc; next: Loc };
  setting?: IndoorOutdoor;
  /** Position on the paper map, 0-100 each axis. */
  pin?: { x: number; y: number };
  reaction?: 'like' | 'dislike';
  saved: boolean;
};

// Order matters: the Home list renders in this order, newest first.
export const mockItems: Item[] = [
  {
    // Place / IG / done. Field confidences span 46-96, with one low-confidence field to review.
    id: 'omakase',
    title: '尖沙咀 Omakase 日式割烹',
    platform: 'instagram',
    contentType: 'place',
    status: 'done',
    transcriptStatus: 'processed',
    meta: { zh: '尖沙咀 · 2 日前', en: 'Tsim Sha Tsui · 2 days ago' },
    url: 'https://www.instagram.com/reel/Cx9mQ2vP1aZ/',
    art: 'sushi',
    gradient: 0,
    relevance: 96,
    highlights: ['主廚發辦 12 道，用料每日空運', '座位只有 8 個，要提早訂位', '午市套餐比晚市平一半'],
    fields: [
      { id: 'name', label: { zh: '店名', en: 'Name' }, value: '尖沙咀 Omakase 日式割烹', confidence: 96, evidence: 'OCR · 0:03' },
      { id: 'addr', label: { zh: '地址', en: 'Address' }, value: '尖沙咀加連威老道 18 號', confidence: 88, evidence: 'ASR · 0:12' },
      { id: 'price', label: { zh: '人均', en: 'Avg. spend' }, value: 'HK$1,280 起', confidence: 72, evidence: 'Caption · L2' },
      { id: 'hours', label: { zh: '營業時間', en: 'Opening hours' }, value: '18:00 – 23:00（週一休息）', confidence: 46, evidence: 'OCR · 0:41' },
    ],
    transcript: [
      { at: '0:03', lang: 'yue', text: '今日帶大家嚟尖沙咀一間好隱世嘅割烹。' },
      { at: '0:12', lang: 'yue', text: '喺加連威老道，行入去先至搵到門口。' },
      { at: '0:41', lang: 'en', text: 'Omakase starts at one thousand two hundred eighty.' },
      { at: '1:05', lang: 'zh', text: '座位非常有限，建議提前一星期預約。' },
    ],
    setting: 'indoor',
    pin: { x: 57, y: 48 },
    saved: true,
  },
  {
    // Recipe / YT / done. Highest confidence in the set (98) plus one mid field.
    id: 'pasta',
    title: '10 分鐘蒜香橄欖油意粉',
    platform: 'youtube',
    contentType: 'recipe',
    status: 'done',
    transcriptStatus: 'processed',
    meta: { zh: '食譜 · 3 日前', en: 'Recipe · 3 days ago' },
    url: 'https://www.youtube.com/shorts/aB3dE5fG7hI',
    art: 'pasta',
    gradient: 2,
    relevance: 91,
    highlights: ['全程只需要一個平底鑊', '蒜片慢火煎至金黃先落意粉水', '最後加辣椒碎提味'],
    fields: [
      { id: 'serve', label: { zh: '份量', en: 'Serves' }, value: '2 人份', confidence: 90, evidence: 'ASR · 0:05' },
      { id: 'time', label: { zh: '時間', en: 'Time' }, value: '10 分鐘', confidence: 98, evidence: 'OCR · 0:02' },
      { id: 'ingr', label: { zh: '材料', en: 'Ingredients' }, value: '意粉 200g、蒜 6 瓣、橄欖油 4 湯匙', confidence: 84, evidence: 'ASR · 0:09' },
      { id: 'heat', label: { zh: '火候', en: 'Heat' }, value: '中小火', confidence: 57, evidence: 'Visual · 0:22' },
    ],
    transcript: [
      { at: '0:05', lang: 'en', text: 'This serves two, and takes only ten minutes.' },
      { at: '0:09', lang: 'yue', text: '蒜頭切片，意粉煮到七成熟就撈起。' },
      { at: '0:22', lang: 'zh', text: '全程用中小火，千萬不要燒焦蒜片。' },
    ],
    saved: false,
  },
  {
    // Place / Threads / done / outdoor. Lowest done-field confidence (35) exercises the 請核對 flag.
    id: 'phoenix',
    title: '大嶼山鳳凰徑半日行',
    platform: 'threads',
    contentType: 'place',
    status: 'done',
    transcriptStatus: 'processed',
    meta: { zh: '大嶼山 · 戶外 · 5 日前', en: 'Lantau · Outdoor · 5 days ago' },
    url: 'https://www.threads.net/@hikehk/post/C8xYz12',
    art: 'hike',
    gradient: 1,
    relevance: 88,
    highlights: ['由梅窩起步，第 5 至 6 段最好行', '山頂可以望到日出雲海', '夏天要帶足兩公升水'],
    fields: [
      { id: 'loc', label: { zh: '地點', en: 'Location' }, value: '大嶼山鳳凰徑', confidence: 94, evidence: 'Caption · L1' },
      { id: 'leg', label: { zh: '路段', en: 'Section' }, value: '第 5–6 段', confidence: 78, evidence: 'OCR · 0:15' },
      { id: 'lvl', label: { zh: '難度', en: 'Difficulty' }, value: '中等', confidence: 67, evidence: 'ASR · 0:30' },
      { id: 'dur', label: { zh: '耗時', en: 'Duration' }, value: '約 4 小時', confidence: 35, evidence: 'ASR · 0:52' },
    ],
    transcript: [
      { at: '0:15', lang: 'yue', text: '今次行鳳凰徑第五段去第六段，風景真係冇得頂。' },
      { at: '0:30', lang: 'zh', text: '難度中等，適合有基本體力的朋友。' },
      { at: '0:52', lang: 'yue', text: '成程大概四個鐘，記得帶水同防曬。' },
    ],
    setting: 'outdoor',
    saved: false,
  },
  {
    // Place / IG / done. Three fields, none below 62.
    id: 'sweet',
    title: '深水埗老字號糖水舖',
    platform: 'instagram',
    contentType: 'place',
    status: 'done',
    transcriptStatus: 'processed',
    meta: { zh: '深水埗 · 1 星期前', en: 'Sham Shui Po · 1 week ago' },
    url: 'https://www.instagram.com/reel/Dd4eF6gH8iJ/',
    art: 'dessert',
    gradient: 3,
    relevance: 84,
    highlights: ['招牌豆腐花同芝麻糊', '開業超過四十年', '只收現金'],
    fields: [
      { id: 'name', label: { zh: '店名', en: 'Name' }, value: '深水埗老字號糖水舖', confidence: 91, evidence: 'OCR · 0:04' },
      { id: 'dish', label: { zh: '招牌', en: 'Signature' }, value: '豆腐花、芝麻糊', confidence: 83, evidence: 'ASR · 0:18' },
      { id: 'pay', label: { zh: '付款', en: 'Payment' }, value: '只收現金', confidence: 62, evidence: 'Caption · L3' },
    ],
    transcript: [
      { at: '0:04', lang: 'yue', text: '深水埗呢間糖水舖，我細個已經食。' },
      { at: '0:18', lang: 'yue', text: '豆腐花滑到入口即化，芝麻糊好香。' },
    ],
    setting: 'indoor',
    pin: { x: 44, y: 36 },
    saved: false,
  },
  {
    // Media / needs_media: caption only, so the song field is 30% and the next step asks for a screen recording.
    id: 'cinema',
    title: '戲院結尾曲是什麼？',
    platform: 'threads',
    contentType: 'media',
    status: 'needs_media',
    transcriptStatus: 'pending',
    meta: { zh: '影視 · 銅鑼灣 · 1 星期前', en: 'Film & TV · Causeway Bay · 1 week ago' },
    url: 'https://www.threads.net/@filmhk/post/D1aB3c4',
    art: 'film',
    gradient: 4,
    relevance: 40,
    highlights: [],
    fields: [{ id: 'song', label: { zh: '歌名', en: 'Song' }, value: '未能辨識', confidence: 30, evidence: 'ASR · 0:08' }],
    transcript: [],
    failure: {
      reason: { zh: '原片無法下載，只取得貼文文字。', en: 'The video could not be downloaded; only the post text was captured.' },
      next: { zh: '請上傳螢幕錄影，我哋先可以辨識歌曲。', en: 'Upload a screen recording so we can identify the song.' },
    },
    saved: false,
  },
  {
    // Place / Threads / done but caption-only: speech was not processed, so the transcript is empty.
    id: 'caption',
    title: '中環隱世咖啡店',
    platform: 'threads',
    contentType: 'place',
    status: 'done',
    transcriptStatus: 'skipped',
    meta: { zh: '中環 · 3 日前', en: 'Central · 3 days ago' },
    url: 'https://www.threads.net/@magpie/post/1',
    art: 'dessert',
    gradient: 2,
    relevance: 71,
    highlights: ['只靠貼文文字抽取', '手沖咖啡同自家烘焙豆'],
    fields: [{ id: 'name', label: { zh: '店名', en: 'Name' }, value: '中環隱世咖啡店', confidence: 85, evidence: 'Caption · L1' }],
    transcript: [],
    setting: 'indoor',
    pin: { x: 62, y: 74 },
    saved: false,
  },
  {
    // Recipe / YT / processing: no data yet, detail shows skeleton placeholders.
    id: 'chicken',
    title: '一鍋煮雞飯',
    platform: 'youtube',
    contentType: 'recipe',
    status: 'processing',
    transcriptStatus: 'pending',
    meta: { zh: '食譜 · 剛剛', en: 'Recipe · just now' },
    url: 'https://www.youtube.com/shorts/kL9mN0oP1qR',
    art: 'pot',
    gradient: 5,
    relevance: 0,
    highlights: [],
    fields: [],
    transcript: [],
    saved: false,
  },
  {
    // Generic / IG / failed: the dead-link case with readable reason and next step.
    id: 'dead',
    title: '一條已失效連結',
    platform: 'instagram',
    contentType: 'generic',
    status: 'failed',
    transcriptStatus: 'pending',
    meta: { zh: '其他 · 2 星期前', en: 'Other · 2 weeks ago' },
    url: 'https://www.instagram.com/reel/removed/',
    art: 'link',
    gradient: 5,
    relevance: 0,
    highlights: [],
    fields: [],
    transcript: [],
    failure: {
      reason: { zh: '連結已失效或為私人內容', en: 'The link is dead or the content is private.' },
      next: { zh: '請改為上傳螢幕錄影', en: 'Upload a screen recording instead.' },
    },
    saved: false,
  },
  {
    // Generic / IG / queued: the fifth status, still waiting for the worker.
    id: 'sneaker',
    title: '旺角波鞋街開箱',
    platform: 'instagram',
    contentType: 'generic',
    status: 'queued',
    transcriptStatus: 'pending',
    meta: { zh: '旺角 · 剛剛', en: 'Mong Kok · just now' },
    url: 'https://www.instagram.com/reel/Ee5fG7hI9jK/',
    art: 'shoe',
    gradient: 2,
    relevance: 0,
    highlights: [],
    fields: [],
    transcript: [],
    setting: 'outdoor',
    saved: false,
  },
];
