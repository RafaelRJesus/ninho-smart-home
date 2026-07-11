import {test,expect} from '@playwright/test';

test('usuário sem sessão vê login e navega pela recuperação sem enumeração',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Bem-vindo de volta'})).toBeVisible();
  await page.getByRole('button',{name:'Esqueci minha senha'}).click();
  await expect(page.getByRole('heading',{name:'Recupere seu acesso'})).toBeVisible();
  await page.getByLabel('E-mail').fill('nao-existe@ninho.local');
  await page.getByRole('button',{name:'Enviar link seguro'}).click();
  await expect(page.getByRole('status')).toContainText('Se o e-mail estiver cadastrado');
});

test('cadastro abre dashboard, destaca menu e logout encerra sessão',async({page},testInfo)=>{
  const email=`e2e-${testInfo.project.name}-${Date.now()}@ninho.local`;
  await page.goto('/');
  await page.getByRole('button',{name:'Criar minha conta'}).click();
  await page.getByLabel('Seu nome').fill('Pessoa E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha-e2e-bem-segura');
  await page.getByRole('button',{name:'Criar conta segura'}).click();
  await expect(page.getByRole('heading',{name:/Olá!/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Visão geral'})).toHaveClass(/active/);
  await expect(page.getByRole('button',{name:'Visão geral'})).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Minha planta'}).click();
  await expect(page.getByRole('button',{name:'Minha planta'})).toHaveClass(/active/);
  await expect(page.getByRole('button',{name:'Minha planta'})).toHaveAttribute('aria-current','page');
  await expect(page.getByRole('heading',{name:/Planta da casa/})).toBeVisible();
  await page.getByRole('button',{name:'Sair'}).click();
  await expect(page.getByRole('heading',{name:'Bem-vindo de volta'})).toBeVisible();
});

test('layout essencial permanece acessível no viewport configurado',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.auth-card')).toBeInViewport();
  await expect(page.getByLabel('E-mail')).toBeEditable();
  await expect(page.getByLabel('Senha')).toBeEditable();
  await page.getByLabel('E-mail').focus();
  await expect(page.getByLabel('E-mail')).toBeFocused();
});

test('link inválido exibe redefinição e erro seguro',async({page})=>{
  await page.goto('/?reset=token-invalido');
  await expect(page.getByRole('heading',{name:'Crie uma nova senha'})).toBeVisible();
  await page.getByLabel('Nova senha',{exact:true}).fill('senha-nova-invalida');
  await page.getByLabel('Confirme a nova senha').fill('senha-nova-invalida');
  await page.getByRole('button',{name:'Salvar nova senha'}).click();
  await expect(page.getByRole('alert')).toContainText('Link inválido, expirado ou já utilizado');
});
