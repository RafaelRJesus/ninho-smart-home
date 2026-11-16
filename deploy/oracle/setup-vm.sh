#!/usr/bin/env bash
# Prepara a VM Ubuntu 24.04 ARM do Oracle Cloud para rodar o Ninho.
# Rodar uma vez, na VM:  sudo bash setup-vm.sh
# Idempotente: pode rodar de novo sem quebrar nada.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "Rode com sudo." >&2; exit 1; fi
APP_USER="${SUDO_USER:-ubuntu}"

echo "==> Atualizando o sistema"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unattended-upgrades netfilter-persistent iptables-persistent

echo "==> Liberando 80 e 443 no iptables (as imagens da Oracle bloqueiam por padrão)"
for port in 80 443; do
  if ! iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 6 -p tcp -m state --state NEW --dport "$port" -j ACCEPT
  fi
done
netfilter-persistent save

echo "==> Instalando Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker "$APP_USER"
systemctl enable --now docker

echo "==> Criando swap de 2 GB"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Ativando atualizações automáticas de segurança"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Desativando login SSH por senha"
cat > /etc/ssh/sshd_config.d/99-ninho.conf <<'EOF'
PasswordAuthentication no
PermitRootLogin no
EOF
systemctl reload ssh

echo "==> Pasta da aplicação e dos backups"
mkdir -p /opt/ninho /opt/backups
chown "$APP_USER":"$APP_USER" /opt/ninho /opt/backups

echo "Pronto. Saia e entre de novo no SSH para o grupo docker valer."
