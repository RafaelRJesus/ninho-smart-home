#!/usr/bin/env bash
set -euo pipefail

: "${SMTP_USERNAME:?Configure o secret ICLOUD_SMTP_USERNAME no GitHub}"
: "${SMTP_PASSWORD:?Configure o secret ICLOUD_APP_PASSWORD no GitHub}"
: "${EMAIL_TO:?Destinatario nao configurado}"

run_url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
results="${UNIT_RESULT} ${INTEGRATION_RESULT} ${POSTGRES_RESULT:-unknown} ${E2E_RESULT:-unknown} ${STATIC_RESULT} ${AUDIT_RESULT} ${BUILD_RESULT} ${SMOKE_RESULT} ${LOAD_RESULT}"
if [[ " ${results} " == *" failure "* || " ${results} " == *" cancelled "* ]]; then
  overall="FALHA"
else
  overall="SUCESSO"
fi

report_file="${RUNNER_TEMP:-/tmp}/ninho-ci-report.txt"
cat > "${report_file}" <<EOF
From: Ninho CI <${SMTP_USERNAME}>
To: ${EMAIL_TO}
Subject: [Ninho] Pipeline diaria: ${overall}
Date: $(LC_ALL=C date -R)
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

Relatorio diario da pipeline Ninho

Status geral: ${overall}
Repositorio: ${GITHUB_REPOSITORY}
Branch: ${GITHUB_REF_NAME}
Commit: ${GITHUB_SHA}

Testes unitarios: ${UNIT_RESULT}
Testes de integracao: ${INTEGRATION_RESULT}
Integracao PostgreSQL: ${POSTGRES_RESULT:-unknown}
Interface E2E: ${E2E_RESULT:-unknown}
Contratos TypeScript: ${STATIC_RESULT}
Auditoria de dependencias: ${AUDIT_RESULT}
Build de producao: ${BUILD_RESULT}
Smoke test: ${SMOKE_RESULT}
Teste de carga: ${LOAD_RESULT}

Detalhes: ${run_url}
EOF

curl --silent --show-error --fail \
  --url "smtp://${SMTP_HOST:-smtp.mail.me.com}:${SMTP_PORT:-587}" \
  --ssl-reqd \
  --user "${SMTP_USERNAME}:${SMTP_PASSWORD}" \
  --mail-from "${SMTP_USERNAME}" \
  --mail-rcpt "${EMAIL_TO}" \
  --upload-file "${report_file}"

echo "Relatorio diario enviado para ${EMAIL_TO}."
