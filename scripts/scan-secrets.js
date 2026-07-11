import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const forbidden = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\b(?:TUYA_ACCESS_SECRET|OPENAI_API_KEY|TURNSTILE_SECRET_KEY|AUTH_SECRET|INTEGRATION_MASTER_KEY)\s*=\s*(?!(?:CHANGE_ME|INJECT_FROM_SECRET_MANAGER|seu_|gere_|chave_))[^\s#]{16,}/i,
];
const findings = [];

for (const file of files) {
  if (/\.(?:png|jpe?g|gif|webp|ico|zip|woff2?)$/i.test(file)) continue;
  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }
  content.split(/\r?\n/).forEach((line, index) => {
    if (forbidden.some(pattern => pattern.test(line))) findings.push(`${file}:${index + 1}`);
  });
}

if (findings.length) {
  console.error(`Possível secret versionado em:\n${findings.join('\n')}`);
  process.exit(1);
}
console.log(`Secret scan aprovado em ${files.length} arquivos rastreados.`);
