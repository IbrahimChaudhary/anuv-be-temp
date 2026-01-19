import { RowDataPacket } from "mysql2";

export interface Song {
  name: string;
  duration: string;
}

export interface PlatformLinks {
  spotify?: string;
  gaana?: string;
  jiosaavn?: string;
  amazon?: string;
}

export interface Playlist {
  id: string;
  title: string;
  cover_image: string | null;
  songs: Song[];
  platform_links: PlatformLinks;
  created_at?: string;
  updated_at?: string;
}

export type PlaylistRow = RowDataPacket & {
  id: string;
  title: string;
  cover_image: string | null;
  spotify_link: string | null;
  gaana_link: string | null;
  jiosaavn_link: string | null;
  amazon_link: string | null;
  created_at: Date;
  updated_at: Date;
};

export type PlaylistSongRow = RowDataPacket & {
  id: number;
  playlist_id: string;
  name: string;
  duration: string;
  song_order: number;
  created_at: Date;
};
