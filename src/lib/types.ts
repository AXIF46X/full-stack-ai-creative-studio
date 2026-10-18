export type PrivacySettings = {
  privateAccount: boolean;
  allowComments: boolean;
  showActivity: boolean;
  aiPersonalization: boolean;
  offlineSync: boolean;
};

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  handle: string;
  bio: string;
  avatarEmoji: string;
  gradient: string;
  plan: string;
  xp: number;
  streak: number;
  interests: string[];
  theme: string;
  accent: string;
  privacy: PrivacySettings;
  isCreator: boolean;
};

export type AuthorDTO = {
  id: number;
  name: string;
  handle: string;
  emoji: string;
  gradient: string;
};

export type ProjectDTO = {
  id: number;
  createdAt: string;
  updatedLabel: string;
  title: string;
  kind: "music" | "creator";
  status: string;
  description: string;
  bpm: number;
  tone: string;
  vocalStyle: string;
  lyrics: string;
  caption: string;
  gradient: string;
  emoji: string;
  progress: number;
  savedOffline: boolean;
};

export type CommentDTO = {
  id: number;
  body: string;
  createdLabel: string;
  isMine: boolean;
  author: AuthorDTO;
};

export type PostDTO = {
  id: number;
  caption: string;
  mediaUrl: string | null;
  mediaKind: string;
  gradient: string;
  emoji: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  createdLabel: string;
  reacted: boolean;
  isMine: boolean;
  author: AuthorDTO;
  comments: CommentDTO[];
};

export type GroupDTO = {
  id: number;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  gradient: string;
  memberCount: number;
  tags: string[];
  joined: boolean;
};

export type ChallengeDTO = {
  id: number;
  title: string;
  description: string;
  xp: number;
  emoji: string;
  category: string;
  completions: number;
  done: boolean;
};

export type BadgeDTO = {
  id: number;
  name: string;
  emoji: string;
  description: string;
  xpRequired: number;
  earned: boolean;
};

export type TrendDTO = {
  id: number;
  title: string;
  subtitle: string;
  kind: string;
  score: number;
  delta: number;
  emoji: string;
  gradient: string;
  tags: string[];
};

export type MarketItemDTO = {
  id: number;
  title: string;
  creator: string;
  category: string;
  price: number;
  emoji: string;
  gradient: string;
  rating: string;
  sales: number;
  owned: boolean;
};

export type AssistantMessageDTO = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdLabel: string;
};

export type CreatorDTO = {
  id: number;
  name: string;
  handle: string;
  emoji: string;
  gradient: string;
  bio: string;
  xp: number;
  blocked: boolean;
};

export type GeneratedCaption = { text: string; tone: string; hashtags: string[] };
export type GeneratedThumbnail = {
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  style: string;
};
export type GeneratedIdea = {
  hook: string;
  format: string;
  beats: string[];
  sound: string;
  tags: string[];
};
