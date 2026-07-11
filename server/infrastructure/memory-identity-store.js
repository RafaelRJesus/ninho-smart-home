import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export class MemoryIdentityStore {
  constructor() { this.users=new Map();this.homes=new Map();this.members=[];this.floors=new Map();this.rooms=new Map();this.integrations=new Map();this.audit=[];this.revokedSessions=new Set();this.passwordResets=new Map(); }
  async createUser({email,password,displayName}) { const normalized=email.trim().toLowerCase();if([...this.users.values()].some(u=>u.email===normalized))return null;const user={id:crypto.randomUUID(),email:normalized,passwordHash:await bcrypt.hash(password,12),displayName,status:'active',sessionVersion:0,createdAt:new Date().toISOString()};this.users.set(user.id,user);return this.publicUser(user); }
  publicUser(user){return {id:user.id,email:user.email,displayName:user.displayName,status:user.status,sessionVersion:user.sessionVersion||0};}
  async authenticate(email,password){const user=[...this.users.values()].find(item=>item.email===String(email).trim().toLowerCase());if(!user||user.status!=='active'||!await bcrypt.compare(String(password),user.passwordHash))return null;return this.publicUser(user);}
  async findUser(id){const user=this.users.get(id);return user?this.publicUser(user):null;}
  async findUserByEmail(email){const user=[...this.users.values()].find(item=>item.email===String(email).trim().toLowerCase());return user?this.publicUser(user):null;}
  async savePasswordReset({userId,tokenHash,expiresAt}){for(const [hash,item] of this.passwordResets)if(item.userId===userId)this.passwordResets.delete(hash);this.passwordResets.set(tokenHash,{userId,expiresAt,usedAt:null});}
  async consumePasswordReset(tokenHash){const item=this.passwordResets.get(tokenHash);if(!item||item.usedAt||new Date(item.expiresAt)<=new Date())return null;item.usedAt=new Date().toISOString();return item.userId;}
  async updatePassword(userId,password){const user=this.users.get(userId);if(!user)return false;user.passwordHash=await bcrypt.hash(password,12);user.sessionVersion=(user.sessionVersion||0)+1;return true;}
  async getSessionVersion(userId){return this.users.get(userId)?.sessionVersion??null;}
  async createHome({name,timezone='America/Sao_Paulo',ownerId}){const home={id:crypto.randomUUID(),name,timezone,createdAt:new Date().toISOString()};this.homes.set(home.id,home);this.members.push({homeId:home.id,userId:ownerId,role:'owner'});return structuredClone(home);}
  async listHomes(userId){const ids=this.members.filter(m=>m.userId===userId).map(m=>m.homeId);return ids.map(id=>structuredClone(this.homes.get(id))).filter(Boolean);}
  async getRole(homeId,userId){return this.members.find(m=>m.homeId===homeId&&m.userId===userId)?.role||null;}
  async createFloor({homeId,name,position}){if([...this.floors.values()].some(f=>f.homeId===homeId&&f.name.toLowerCase()===name.toLowerCase()))return null;const floor={id:crypto.randomUUID(),homeId,name,position,createdAt:new Date().toISOString()};this.floors.set(floor.id,floor);return structuredClone(floor);}
  async listFloors(homeId){return [...this.floors.values()].filter(f=>f.homeId===homeId).sort((a,b)=>a.position-b.position).map(item=>structuredClone(item));}
  async findFloor(homeId,floorId){const floor=this.floors.get(floorId);return floor?.homeId===homeId?structuredClone(floor):null;}
  async createRoom({floorId,name,position}){if([...this.rooms.values()].some(r=>r.floorId===floorId&&r.name.toLowerCase()===name.toLowerCase()))return null;const room={id:crypto.randomUUID(),floorId,name,position,createdAt:new Date().toISOString()};this.rooms.set(room.id,room);return structuredClone(room);}
  async listRooms(floorId){return [...this.rooms.values()].filter(r=>r.floorId===floorId).sort((a,b)=>a.position-b.position).map(item=>structuredClone(item));}
  async listHomeRooms(homeId){const floorIds=new Set((await this.listFloors(homeId)).map(item=>item.id));return [...this.rooms.values()].filter(room=>floorIds.has(room.floorId)).sort((a,b)=>a.position-b.position).map(item=>structuredClone(item));}
  async updateRoom(homeId,id,patch){const room=this.rooms.get(id);const floor=this.floors.get(room?.floorId);if(!room||floor?.homeId!==homeId)return null;if(patch.name&&[...this.rooms.values()].some(item=>item.id!==id&&item.floorId===room.floorId&&item.name.toLowerCase()===patch.name.toLowerCase()))return false;Object.assign(room,patch);return structuredClone(room);}
  async reorderRooms(homeId,ids){const rooms=await this.listHomeRooms(homeId);if(ids.length!==rooms.length||ids.some(id=>!rooms.some(room=>room.id===id)))return null;ids.forEach((id,position)=>{this.rooms.get(id).position=position});return this.listHomeRooms(homeId);}
  async deleteRoom(homeId,id){const room=this.rooms.get(id);const floor=this.floors.get(room?.floorId);return floor?.homeId===homeId?this.rooms.delete(id):false;}
  async record(event){this.audit.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),...event});}
  async listAudit(homeId){return this.audit.filter(item=>item.homeId===homeId).map(item=>structuredClone(item)).reverse();}
  async saveIntegrationCredential({homeId,provider,sealed,actorId}){const id=`${homeId}:${provider}`;const current=this.integrations.get(id);const item={id,homeId,provider,sealed,status:'configured',createdAt:current?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),updatedBy:actorId};this.integrations.set(id,item);return this.publicIntegration(item);}
  async findIntegrationCredential(homeId,provider){const item=this.integrations.get(`${homeId}:${provider}`);return item?structuredClone(item):null;}
  async listIntegrations(homeId){return [...this.integrations.values()].filter(item=>item.homeId===homeId).map(item=>this.publicIntegration(item));}
  async deleteIntegrationCredential(homeId,provider){return this.integrations.delete(`${homeId}:${provider}`);}
  publicIntegration(item){return {id:item.id,homeId:item.homeId,provider:item.provider,status:item.status,keyVersion:item.sealed.keyVersion,createdAt:item.createdAt,updatedAt:item.updatedAt};}
  revoke(jti){this.revokedSessions.add(jti)} isRevoked(jti){return this.revokedSessions.has(jti)}
}
