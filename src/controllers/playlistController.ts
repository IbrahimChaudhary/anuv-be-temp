import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader } from 'mysql2';
import { PlaylistRow, PlaylistSongRow, Playlist, PlatformLinks, Song } from '../types/playlistTypes';
import { ApiResponse } from '../types/responseTypes';
import { uploadToCloudinary } from '../config/cloudinary';

const transformPlaylistData = (playlistRow: PlaylistRow, songRows: PlaylistSongRow[]): Playlist => {
  const songs: Song[] = songRows.map(song => ({
    name: song.name,
    duration: song.duration
  }));

  const platform_links: PlatformLinks = {
    spotify: playlistRow.spotify_link || undefined,
    gaana: playlistRow.gaana_link || undefined,
    jiosaavn: playlistRow.jiosaavn_link || undefined,
    amazon: playlistRow.amazon_link || undefined
  };

  return {
    id: playlistRow.id,
    title: playlistRow.title,
    cover_image: playlistRow.cover_image || '',
    songs,
    platform_links,
    created_at: playlistRow.created_at.toISOString(),
    updated_at: playlistRow.updated_at.toISOString()
  };
};

export const getPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [playlistRows] = await db.query<PlaylistRow[]>(
      'SELECT * FROM playlists WHERE id = ?',
      [id]
    );

    if (playlistRows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
      return;
    }

    const [songRows] = await db.query<PlaylistSongRow[]>(
      'SELECT * FROM playlist_songs WHERE playlist_id = ? ORDER BY song_order ASC',
      [id]
    );

    const playlist = transformPlaylistData(playlistRows[0], songRows);

    const response: ApiResponse<Playlist> = {
      success: true,
      data: playlist
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getRandomPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const [playlistRows] = await db.query<PlaylistRow[]>(
      'SELECT * FROM playlists ORDER BY RAND() LIMIT 1'
    );

    if (playlistRows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No playlists found'
      });
      return;
    }

    const [songRows] = await db.query<PlaylistSongRow[]>(
      'SELECT * FROM playlist_songs WHERE playlist_id = ? ORDER BY song_order ASC',
      [playlistRows[0].id]
    );

    const playlist = transformPlaylistData(playlistRows[0], songRows);

    const response: ApiResponse<Playlist> = {
      success: true,
      data: playlist
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching random playlist:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllPlaylists = async (req: Request, res: Response): Promise<void> => {
  try {
    const [playlistRows] = await db.query<PlaylistRow[]>(
      'SELECT * FROM playlists ORDER BY created_at DESC'
    );

    const playlists: Playlist[] = [];

    for (const playlistRow of playlistRows) {
      const [songRows] = await db.query<PlaylistSongRow[]>(
        'SELECT * FROM playlist_songs WHERE playlist_id = ? ORDER BY song_order ASC',
        [playlistRow.id]
      );

      playlists.push(transformPlaylistData(playlistRow, songRows));
    }

    const response: ApiResponse<Playlist[]> = {
      success: true,
      data: playlists
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, songs: songsString, platform_links: platformLinksString } = req.body;

    if (!title || !songsString) {
      res.status(400).json({
        success: false,
        error: 'title and songs are required'
      });
      return;
    }

    let songs;
    let platform_links;

    try {
      songs = JSON.parse(songsString);
      platform_links = platformLinksString ? JSON.parse(platformLinksString) : {};
    } catch (parseError) {
      res.status(400).json({
        success: false,
        error: 'Invalid JSON format for songs or platform_links'
      });
      return;
    }

    if (!Array.isArray(songs) || songs.length === 0) {
      res.status(400).json({
        success: false,
        error: 'songs must be a non-empty array'
      });
      return;
    }

    const id = `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let coverImageUrl: string | null = null;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'playlists');
      coverImageUrl = uploadResult.url;
    }

    await db.query<ResultSetHeader>(
      `INSERT INTO playlists (id, title, cover_image, spotify_link, gaana_link, jiosaavn_link, amazon_link)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        coverImageUrl,
        platform_links?.spotify || null,
        platform_links?.gaana || null,
        platform_links?.jiosaavn || null,
        platform_links?.amazon || null
      ]
    );

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      await db.query<ResultSetHeader>(
        'INSERT INTO playlist_songs (playlist_id, name, duration, song_order) VALUES (?, ?, ?, ?)',
        [id, song.name, song.duration, i]
      );
    }

    const [playlistRows] = await db.query<PlaylistRow[]>(
      'SELECT * FROM playlists WHERE id = ?',
      [id]
    );

    const [songRows] = await db.query<PlaylistSongRow[]>(
      'SELECT * FROM playlist_songs WHERE playlist_id = ? ORDER BY song_order ASC',
      [id]
    );

    const playlist = transformPlaylistData(playlistRows[0], songRows);

    const response: ApiResponse<Playlist> = {
      success: true,
      data: playlist
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating playlist:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        error: 'Playlist with this ID already exists'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updatePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, songs: songsString, platform_links: platformLinksString } = req.body;
 
    const [existingPlaylist] = await db.query<PlaylistRow[]>(
      'SELECT * FROM playlists WHERE id = ?',
      [id]
    );

    if (existingPlaylist.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
      return;
    }

    let songs;
    let platform_links;

    if (songsString) {
      try {
        songs = JSON.parse(songsString);
        if (!Array.isArray(songs)) {
          res.status(400).json({
            success: false,
            error: 'songs must be an array'
          });
          return;
        }
      } catch (parseError) {
        console.error('7. Error parsing songs:', parseError);
        res.status(400).json({
          success: false,
          error: 'Invalid JSON format for songs'
        });
        return;
      }
    }

    if (platformLinksString) {
      try {
        platform_links = JSON.parse(platformLinksString);
      } catch (parseError) {
        console.error('10. Error parsing platform_links:', parseError);
        res.status(400).json({
          success: false,
          error: 'Invalid JSON format for platform_links'
        });
        return;
      }
    }

    let coverImageUrl: string | null = existingPlaylist[0].cover_image;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'playlists');
        coverImageUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('13. Error uploading to Cloudinary:', uploadError);
        throw uploadError;
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }

    if (req.file) {
      updateFields.push('cover_image = ?');
      updateValues.push(coverImageUrl);
    }

    if (platform_links) {
      updateFields.push('spotify_link = ?');
      updateValues.push(platform_links.spotify || null);
      updateFields.push('gaana_link = ?');
      updateValues.push(platform_links.gaana || null);
      updateFields.push('jiosaavn_link = ?');
      updateValues.push(platform_links.jiosaavn || null);
      updateFields.push('amazon_link = ?');
      updateValues.push(platform_links.amazon || null);
    }


    if (updateFields.length > 0) {
      updateValues.push(id);
      await db.query<ResultSetHeader>(
        `UPDATE playlists SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    if (songs) {
      await db.query<ResultSetHeader>(
        'DELETE FROM playlist_songs WHERE playlist_id = ?',
        [id]
      );
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        await db.query<ResultSetHeader>(
          'INSERT INTO playlist_songs (playlist_id, name, duration, song_order) VALUES (?, ?, ?, ?)',
          [id, song.name, song.duration, i]
        );
      }
    }

    const [playlistRows] = await db.query<PlaylistRow[]>(
      'SELECT * FROM playlists WHERE id = ?',
      [id]
    );

    const [songRows] = await db.query<PlaylistSongRow[]>(
      'SELECT * FROM playlist_songs WHERE playlist_id = ? ORDER BY song_order ASC',
      [id]
    );

    const playlist = transformPlaylistData(playlistRows[0], songRows);

    const response: ApiResponse<Playlist> = {
      success: true,
      data: playlist
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deletePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM playlists WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
