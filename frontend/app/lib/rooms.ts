import { supabase } from './supabase'

export interface RoomPlayer {
  id: string;
  room_code: string;
  player_name: string;
  team: 'attack' | 'defend';
  is_host: boolean;
  is_ready: boolean;
  joined_at: string;
}

export interface Room {
  id: string;
  code: string;
  host_player_name: string;
  status: 'waiting' | 'starting' | 'active';
  mode: string;
  created_at: string;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length: 6}, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export async function createRoom(playerName: string, team: 'attack' | 'defend'): Promise<string> {
  const code = generateRoomCode()
  
  // Insert room
  const { error: roomError } = await supabase
    .from('rooms')
    .insert({ code, host_player_name: playerName, status: 'waiting' })
  
  if (roomError) {
    throw roomError
  }
  
  // Insert host as first player
  const { error: playerError } = await supabase
    .from('room_players')
    .insert({ 
      room_code: code, 
      player_name: playerName, 
      team, 
      is_host: true, 
      is_ready: true 
    })
  
  if (playerError) {
    throw playerError
  }
  
  return code
}

export async function joinRoom(
  code: string, playerName: string, team: 'attack' | 'defend'
): Promise<Room> {
  const cleanCode = code.toUpperCase().trim()

  // Check room exists
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', cleanCode)
    .maybeSingle()
  
  if (error) {
    throw new Error('Connection failed — check your internet')
  }
  
  if (!room) {
    throw new Error(`Room ${cleanCode} does not exist`)
  }

  if (room.status !== 'waiting') {
    throw new Error('This game has already begun')
  }
  
  // Check room is full (>6 players)
  const { data: currentPlayers, error: countError } = await supabase
    .from('room_players')
    .select('id')
    .eq('room_code', cleanCode)
  
  if (countError) {
    throw new Error('Connection failed — check your internet')
  }

  if (currentPlayers && currentPlayers.length >= 6) {
    throw new Error('Room is full')
  }
  
  // Check not duplicate name
  const { data: existing, error: dupError } = await supabase
    .from('room_players')
    .select('id')
    .eq('room_code', cleanCode)
    .eq('player_name', playerName)
  
  if (dupError) {
    throw new Error('Connection failed — check your internet')
  }

  if (existing && existing.length > 0) {
    throw new Error('Name already taken in this room')
  }
  
  // Insert player
  const { error: insertError } = await supabase
    .from('room_players')
    .insert({
      room_code: cleanCode,
      player_name: playerName,
      team,
      is_host: false,
      is_ready: false
    })
  
  if (insertError) {
    throw insertError
  }
  
  return room
}

export async function startGame(code: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'starting' })
    .eq('code', code.toUpperCase())
  
  if (error) {
    throw error
  }
}

export async function leaveRoom(
  code: string, playerName: string, isHost: boolean
): Promise<void> {
  const cleanCode = code.toUpperCase().trim()
  if (isHost) {
    // Delete room entirely (cascade deletes room_players)
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('code', cleanCode)
    if (error) throw error
  } else {
    // Delete only the player
    const { error } = await supabase
      .from('room_players')
      .delete()
      .eq('room_code', cleanCode)
      .eq('player_name', playerName)
    if (error) throw error
  }
}
