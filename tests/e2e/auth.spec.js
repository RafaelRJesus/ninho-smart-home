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
  await expect(page.getByTestId('dashboard-ready')).toBeVisible();
  await expect(page.getByText('Segurança',{exact:true})).toBeVisible();
  await expect(page.getByText('Internet e hubs',{exact:true})).toBeVisible();
  await expect(page.getByText('Câmeras',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Visão geral'})).toHaveClass(/active/);
  await expect(page.getByRole('button',{name:'Visão geral'})).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Minha planta'}).click();
  await expect(page.getByRole('button',{name:'Minha planta'})).toHaveClass(/active/);
  await expect(page.getByRole('button',{name:'Minha planta'})).toHaveAttribute('aria-current','page');
  await expect(page.getByRole('heading',{name:/Planta da casa/})).toBeVisible();
  await page.getByRole('button',{name:'Sair'}).click();
  await expect(page.getByRole('heading',{name:'Bem-vindo de volta'})).toBeVisible();
});

test('dashboard operacional fica pronto em menos de três segundos em condição normal',async({page},testInfo)=>{
  const email=`dashboard-${testInfo.project.name}-${Date.now()}@ninho.local`;
  await page.goto('/');await page.getByRole('button',{name:'Criar minha conta'}).click();
  await page.getByLabel('Seu nome').fill('Dashboard E2E');await page.getByLabel('E-mail').fill(email);await page.getByLabel('Senha').fill('senha-dashboard-e2e');
  const started=Date.now();await page.getByRole('button',{name:'Criar conta segura'}).click();
  await expect(page.getByTestId('dashboard-ready')).toBeVisible({timeout:3000});
  expect(Date.now()-started).toBeLessThan(3000);
  await expect(page.getByText('Energia ainda não configurada')).toBeVisible();
  await expect(page.getByText('Nenhuma luz vinculada')).toBeVisible();
  await expect(page.getByText('Nenhuma execução recente')).toBeVisible();
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

test('configurações oferecem fluxos acessíveis para Tuya e Home Assistant',async({page})=>{
  const suffix=`${Date.now()}-${Math.random()}`;
  await page.goto('/');await page.getByRole('button',{name:'Criar minha conta'}).click();
  await page.getByLabel('Seu nome').fill('Integração E2E');await page.getByLabel('E-mail').fill(`integration-${suffix}@ninho.local`);await page.getByLabel('Senha').fill('senha-integracao-e2e');await page.getByRole('button',{name:'Criar conta segura'}).click();
  await page.getByRole('button',{name:'Configurações'}).click();
  const tuya=page.getByRole('tab',{name:'Tuya / Ekaza'});const ha=page.getByRole('tab',{name:'Home Assistant'});
  await expect(tuya).toHaveAttribute('aria-selected','true');await ha.click();await expect(ha).toHaveAttribute('aria-selected','true');
  await expect(page.getByLabel('URL do Home Assistant')).toBeVisible();await expect(page.getByLabel('Long-Lived Access Token')).toHaveAttribute('type','password');
  await expect(page.getByRole('button',{name:'Testar'})).toBeDisabled();await expect(page.getByRole('button',{name:'Sincronizar'})).toBeDisabled();
});

test('planta permite upload, seleção de piso, cômodo e tela cheia',async({page},testInfo)=>{
  const email=`floorplan-${testInfo.project.name}-${Date.now()}@ninho.local`;
  await page.goto('/');await page.getByRole('button',{name:'Criar minha conta'}).click();
  await page.getByLabel('Seu nome').fill('Planta E2E');await page.getByLabel('E-mail').fill(email);await page.getByLabel('Senha').fill('senha-planta-e2e');await page.getByRole('button',{name:'Criar conta segura'}).click();
  await expect(page.getByTestId('dashboard-ready')).toBeVisible();
  const homeId=await page.evaluate(async()=>await (await fetch('/api/v1/homes')).json()).then(homes=>homes[0].id);
  await page.evaluate(async id=>{const floor=await (await fetch(`/api/v1/homes/${id}/floors`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Superior'})})).json();await fetch(`/api/v1/homes/${id}/floors/${floor.id}/rooms`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Escritório'})});},homeId);
  await page.reload();await expect(page.getByTestId('dashboard-ready')).toBeVisible();
  await page.getByRole('button',{name:'Minha planta'}).click();
  await expect(page.getByRole('tab',{name:'Térreo'})).toHaveAttribute('aria-selected','true');
  await page.locator('input[type="file"]').setInputFiles({name:'terreo.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dfe9e5"/></svg>')});
  await expect(page.getByAltText('Planta terreo.svg')).toBeVisible();
  await page.getByRole('button',{name:/SALA/}).click();await expect(page.locator('.room-context')).toContainText('Sala');
  await page.getByRole('tab',{name:'Superior'}).click();await expect(page.getByRole('tab',{name:'Superior'})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('button',{name:/ESCRITÓRIO/})).toBeVisible();await expect(page.getByAltText('Planta terreo.svg')).toHaveCount(0);
  await page.getByRole('button',{name:'Abrir em tela cheia'}).click();await expect(page.locator('.floorplan-shell')).toHaveClass(/fullscreen/);await page.getByRole('button',{name:'Sair da tela cheia'}).click();
});

test('gesto mobile de dois dedos altera o zoom e respeita os limites',async({page},testInfo)=>{
  test.skip(!testInfo.project.name.startsWith('mobile'),'Cenário exclusivo do projeto mobile');
  const email=`pinch-${Date.now()}@ninho.local`;await page.goto('/');await page.getByRole('button',{name:'Criar minha conta'}).click();
  await page.getByLabel('Seu nome').fill('Pinch E2E');await page.getByLabel('E-mail').fill(email);await page.getByLabel('Senha').fill('senha-pinch-e2e');await page.getByRole('button',{name:'Criar conta segura'}).click();await expect(page.getByTestId('dashboard-ready')).toBeVisible();await page.getByRole('button',{name:'Minha planta'}).click();
  const viewport=page.locator('.floorplan-viewport');await viewport.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',clientX:120,clientY:200});await viewport.dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch',clientX:220,clientY:200});await viewport.dispatchEvent('pointermove',{pointerId:2,pointerType:'touch',clientX:300,clientY:200});
  await expect(page.locator('.floorplan-controls output')).toHaveText('180%');await viewport.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch'});await viewport.dispatchEvent('pointerup',{pointerId:2,pointerType:'touch'});
});

test('comando na planta mostra pendência, restaura falha e permite tentar novamente',async({page},testInfo)=>{
  const email=`device-command-${testInfo.project.name}-${Date.now()}@ninho.local`;
  await page.goto('/');await page.getByRole('button',{name:'Criar minha conta'}).click();
  await page.getByLabel('Seu nome').fill('Comando E2E');await page.getByLabel('E-mail').fill(email);await page.getByLabel('Senha').fill('senha-comando-e2e');await page.getByRole('button',{name:'Criar conta segura'}).click();await expect(page.getByTestId('dashboard-ready')).toBeVisible();
  const homeId=await page.evaluate(async()=>await (await fetch('/api/v1/homes')).json()).then(homes=>homes[0].id);
  await page.evaluate(async id=>{const rooms=await (await fetch(`/api/v1/homes/${id}/rooms`)).json();await fetch(`/api/v1/homes/${id}/devices`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Luz da planta',roomId:rooms[0].id,type:'light',power:false,x:35,y:45})});},homeId);
  await page.reload();await expect(page.getByTestId('dashboard-ready')).toBeVisible();await page.getByRole('button',{name:'Minha planta'}).click();
  const point=page.getByRole('button',{name:'Luz da planta, desligado'});await expect(point).toBeVisible();await point.click();
  let attempts=0;await page.route('**/api/v1/homes/*/devices/*',async route=>{if(route.request().method()!=='PATCH'||attempts++>0)return route.continue();await new Promise(resolve=>{setTimeout(resolve,250)});await route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({code:'DEVICE_COMMAND_FAILED',message:'Não foi possível confirmar o comando no dispositivo.'})});});
  await page.getByRole('button',{name:'Ligar'}).click();await expect(page.getByRole('button',{name:'Confirmando...'})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar');await expect(page.getByRole('button',{name:'Tentar novamente'})).toBeVisible();await expect(page.locator('.point.error')).toHaveCount(1);
  await page.getByRole('button',{name:'Tentar novamente'}).click();await expect(page.getByRole('button',{name:'Desligar'})).toBeVisible();await expect(page.locator('.point.on')).toHaveCount(1);
});

test('painel mostra apenas capacidades suportadas e confirma ação crítica com PIN',async({page},testInfo)=>{
  const email=`advanced-${testInfo.project.name}-${Date.now()}@ninho.local`;
  await page.goto('/');await page.getByRole('button',{name:'Criar minha conta'}).click();await page.getByLabel('Seu nome').fill('Controles avançados');await page.getByLabel('E-mail').fill(email);await page.getByLabel('Senha').fill('senha-controles-avancados');await page.getByRole('button',{name:'Criar conta segura'}).click();await expect(page.getByTestId('dashboard-ready')).toBeVisible();
  const homeId=await page.evaluate(async()=>await (await fetch('/api/v1/homes')).json()).then(homes=>homes[0].id);
  await page.evaluate(async id=>{const rooms=await (await fetch(`/api/v1/homes/${id}/rooms`)).json();await fetch(`/api/v1/homes/${id}/devices`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Fechadura principal',roomId:rooms[0].id,type:'lock',locked:true,x:42,y:38,capabilities:[{code:'locked',writable:true}]})});},homeId);
  await page.reload();await expect(page.getByTestId('dashboard-ready')).toBeVisible();await page.getByRole('button',{name:'Minha planta'}).click();await page.getByRole('button',{name:/Fechadura principal/}).click();
  await expect(page.getByRole('button',{name:'Destrancar fechadura'})).toBeVisible();await expect(page.getByRole('button',{name:'Ligar'})).toHaveCount(0);await expect(page.getByLabel('Cor da iluminação')).toHaveCount(0);
  await page.getByRole('button',{name:'Destrancar fechadura'}).click();await expect(page.getByRole('alertdialog',{name:'Confirmar ação crítica'})).toBeVisible();await expect(page.getByRole('button',{name:'Confirmar com PIN'})).toBeDisabled();await page.getByLabel('PIN de segurança').fill('7419');await page.getByRole('button',{name:'Confirmar com PIN'}).click();await expect(page.getByRole('button',{name:'Trancar fechadura'})).toBeVisible();
});
