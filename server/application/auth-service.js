import { AppError } from '../core/app-error.js';

export class AuthService {
  constructor({identity,tokens}){this.identity=identity;this.tokens=tokens;}
  issue(user){return {accessToken:this.tokens.sign({sub:user.id,email:user.email},15*60,'access'),refreshToken:this.tokens.sign({sub:user.id},7*24*60*60,'refresh'),expiresIn:900,user};}
  async register(input){if(!input.email||!input.password||input.password.length<10||!input.displayName)throw new AppError('VALIDATION_ERROR','E-mail, nome e senha com ao menos 10 caracteres são obrigatórios.',400);const user=await this.identity.createUser(input);if(!user)throw new AppError('EMAIL_ALREADY_EXISTS','E-mail já cadastrado.',409);await this.identity.record({type:'USER_REGISTERED',actorId:user.id,result:'succeeded'});return this.issue(user);}
  async login(email,password){const user=await this.identity.authenticate(email,password);if(!user){await this.identity.record({type:'LOGIN_FAILED',result:'failed'});throw new AppError('INVALID_CREDENTIALS','E-mail ou senha inválidos.',401);}await this.identity.record({type:'LOGIN_SUCCEEDED',actorId:user.id,result:'succeeded'});return this.issue(user);}
  async refresh(token){const payload=this.tokens.verify(token,'refresh');if(await this.identity.isRevoked(payload.jti))throw new AppError('INVALID_SESSION','Sessão revogada.',401);await this.identity.revoke(payload.jti);const user=await this.identity.findUser(payload.sub);if(!user)throw new AppError('INVALID_SESSION','Sessão inválida.',401);return this.issue(user);}
  async logout(refreshToken){if(!refreshToken)return;try{const payload=this.tokens.verify(refreshToken,'refresh');await this.identity.revoke(payload.jti)}catch{}}
}
