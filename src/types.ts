export type CreatorStatus = "PITCH" | "AUTHORIZED" | "REMOVED";

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  category: string;
  followersCount: string;
  voiceName: "Zephyr" | "Fenrir" | "Kore" | "Puck" | "Charon";
  description: string;
  videoChannelContext?: string;
  /** PITCH = demo content, AUTHORIZED = real creator, REMOVED = delisted */
  status?: CreatorStatus;
}

export interface Drop {
  id: string;
  creatorId: string;
  title: string;
  content: string;
  voiceName: string;
  category: string;
  dateSent: string;
  tone: string;
  isAdult: boolean;
  anchorTitle: string;
  anchorSource: "YouTube" | "Netflix" | "Radio" | "Podcast" | "Website" | "Broadcast";
  anchorLink: string;
  anchorTimeCode?: string;
  transcriptContext?: string;
}

export interface FinancialInputs {
  mau: number;
  conversionRate: number; // e.g. 5 for 5%
  cpmRate: number; // e.g. $6 CPM matching user interest declarations
  creatorTakeRate: number; // e.g. 15% platform cut
}

export interface FinancialMetric {
  label: string;
  value: string;
  sub: string;
}
