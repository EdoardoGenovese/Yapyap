import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error', err => console.error('❌ Redis error:', err))

export const REDIS_KEYS = {
  userOnline: (userId: string) => `user:${userId}:online`,
  roomOnline: (roomId: string) => `room:${roomId}:online`,
  typing: (roomId: string, userId: string) => `typing:${roomId}:${userId}`,
}

export async function setUserOnline(userId: string, socketId: string) {
  await redis.setex(REDIS_KEYS.userOnline(userId), 300, socketId)
}

export async function setUserOffline(userId: string) {
  await redis.del(REDIS_KEYS.userOnline(userId))
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const result = await redis.exists(REDIS_KEYS.userOnline(userId))
  return result === 1
}

export async function addUserToRoom(roomId: string, userId: string) {
  await redis.sadd(REDIS_KEYS.roomOnline(roomId), userId)
  await redis.expire(REDIS_KEYS.roomOnline(roomId), 300)
}

export async function removeUserFromRoom(roomId: string, userId: string) {
  await redis.srem(REDIS_KEYS.roomOnline(roomId), userId)
}

export async function getRoomOnlineUsers(roomId: string): Promise<string[]> {
  return redis.smembers(REDIS_KEYS.roomOnline(roomId))
}

export async function setTyping(roomId: string, userId: string) {
  await redis.setex(REDIS_KEYS.typing(roomId, userId), 5, '1')
}

export async function clearTyping(roomId: string, userId: string) {
  await redis.del(REDIS_KEYS.typing(roomId, userId))
}
