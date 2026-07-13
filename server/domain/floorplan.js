import {AppError} from '../core/app-error.js';

const allowed=new Set(['image/png','image/jpeg','image/webp','image/svg+xml']);
const dangerousSvg=/<script\b|\bon\w+\s*=|javascript:|<foreignObject\b|<!DOCTYPE|<!ENTITY|@import|url\s*\(|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/)/i;
const invalid=message=>new AppError('INVALID_FLOORPLAN_UPLOAD',message,400);

function validateBackground(background){
  if(background===null)return null;
  if(!background||typeof background!=='object'||Array.isArray(background))throw invalid('Fundo da planta inválido.');
  const name=String(background.name||'').trim();const mime=String(background.mime||'').toLowerCase();const dataUrl=String(background.dataUrl||'');
  if(!name||name.length>120)throw invalid('Nome do arquivo inválido.');
  if(!allowed.has(mime))throw invalid('Use uma imagem PNG, JPEG, WebP ou SVG.');
  const match=dataUrl.match(/^data:([^;,]+);base64,([a-z0-9+/=]+)$/i);
  if(!match||match[1].toLowerCase()!==mime)throw invalid('Conteúdo da imagem inválido.');
  let content;try{content=Buffer.from(match[2],'base64');}catch{throw invalid('Conteúdo da imagem inválido.');}
  if(!content.length||content.length>2*1024*1024)throw invalid('A planta deve ter no máximo 2 MB.');
  if(mime==='image/svg+xml'){
    const svg=content.toString('utf8');
    if(!/^\s*<svg\b/i.test(svg)||dangerousSvg.test(svg))throw invalid('O SVG contém conteúdo não permitido.');
  }
  return {name,mime,dataUrl};
}

export function validateFloorplanContent(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw invalid('Planta inválida.');
  const floors=input.floors;
  if(floors!==undefined&&(!floors||typeof floors!=='object'||Array.isArray(floors)))throw invalid('Pisos da planta inválidos.');
  const normalized={floors:{}};
  for(const [floorId,value] of Object.entries(floors||{})){
    if(!/^[a-z0-9-]{1,80}$/i.test(floorId)||!value||typeof value!=='object'||Array.isArray(value))throw invalid('Piso da planta inválido.');
    normalized.floors[floorId]={background:validateBackground(value.background??null)};
  }
  return normalized;
}
