export interface Photo {
  id: string;
  url: string; // The potentially cropped/processed URL
  originalUrl: string; // Keep original for re-cropping
  file?: File;
  caption?: string;
  width?: number;
  height?: number;
  layoutPreference?: 'full' | 'half' | 'quarter';
}

export interface AlbumPage {
  id: string;
  photos: Photo[];
  anecdote?: string;
  layout: 'grid' | 'collage' | 'focus';
}

export interface Album {
  id: string;
  title: string;
  date: string;
  themeColor: string;
  coverImage?: string; // Base64 or URL
  pages: AlbumPage[];
}

export enum AppStep {
  DETAILS = 0,
  UPLOAD = 1,
  STANDARDIZE = 2, // New step
  EDIT = 3,
  COVER = 4,
  PREVIEW = 5,
}

export const THEME_COLORS = [
  { name: 'Sunset Pink', hex: '#FF8FA3', bg: 'bg-[#FF8FA3]' },
  { name: 'Ocean Blue', hex: '#8AC6D1', bg: 'bg-[#8AC6D1]' },
  { name: 'Matcha Green', hex: '#B5D8A6', bg: 'bg-[#B5D8A6]' },
  { name: 'Lavender', hex: '#CDB4DB', bg: 'bg-[#CDB4DB]' },
  { name: 'Midnight', hex: '#2D3748', bg: 'bg-[#2D3748]' },
];