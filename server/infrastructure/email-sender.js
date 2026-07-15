import nodemailer from 'nodemailer';

export class EmailSender {
  constructor({host=process.env.SMTP_HOST,port=Number(process.env.SMTP_PORT||587),user=process.env.SMTP_USERNAME,password=process.env.SMTP_PASSWORD,from=process.env.SMTP_FROM||process.env.SMTP_USERNAME}={}){this.user=user;this.from=from;this.transport=host&&user&&password?nodemailer.createTransport({host,port,secure:port===465,auth:{user,pass:password},requireTLS:port!==465,disableFileAccess:true,disableUrlAccess:true}):null;}
  async sendPasswordReset({email,displayName,url}){if(!this.transport)return false;await this.transport.sendMail({from:this.from,to:email,subject:'Redefina sua senha do Ninho',text:`Olá, ${displayName}.\n\nUse este link para criar uma nova senha. Ele expira em 30 minutos e funciona uma única vez:\n${url}\n\nSe você não solicitou a alteração, ignore esta mensagem.`});return true;}
  async sendNotification({email,title,message}){if(!this.transport)return false;await this.transport.sendMail({from:this.from,to:email,subject:`Ninho — ${title}`,text:message});return true;}
}
