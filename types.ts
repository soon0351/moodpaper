export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  createdAt: number;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
}

export type AspectRatio = "9:16"; // Fixed for this app
