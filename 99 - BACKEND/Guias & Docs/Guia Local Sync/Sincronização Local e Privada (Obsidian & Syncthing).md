
> Este guia ensina a sincronização rápida, segura, sem nuvem, via rede local (LAN), imune a falhas de internet e otimizada para notas do Obsidian.

---

## Passo 1: Downloads (O Software Correto)

Não baixe versões genéricas. Use estas versões específicas para garantir estabilidade e recursos nativos.

- **No PC (Windows x64):**
    
    - **Software:** SyncTrayzor (Wrapper oficial com interface gráfica e auto-início).
        
    - **Link:** [GitHub - SyncTrayzor Releases](https://github.com/GermanCoding/SyncTrayzor/releases/tag/v2.1.0)
        
    - **Arquivo:** Baixe o `SyncTrayzorSetup-x64.exe`.
        
- **No Celular (Android):**
    
    - **Software:** Syncthing-Fork (Versão otimizada para bateria e controle).
        
    - **Link:** [GitHub - Syncthing-Fork](https://github.com/researchxxl/syncthing-android).
        
    - **Arquivo:** Baixe o APK mais recente.
        

---

## Passo 2: Configuração no PC (SyncTrayzor)

Abra o SyncTrayzor. Se o firewall do Windows perguntar, marque **Privado** e **Público** e permita.

![[Instalação Local Sync-1769536173063.webp|1034x659]]

## 1. Limpeza e Segurança (Menu `Actions` > `Settings` )

Vá na aba **Connections** (Conexões) e configure assim para forçar estabilidade:
-  **Limit Bandwidth in LAN:** Desmarcar.
    
-  **Enable NAT traversal:** Desmarcar (Não precisamos furar roteador, é só local).
    
-  **Global Discovery:** Desmarcar (Privacidade total).
    
-  ==**Local Discovery:** **MARCAR** (Essencial para se acharem no Wi-Fi).==
    
-  **Enable Relaying:** Desmarcar (Velocidade máxima, sem servidores lentos).
    
- **Sync Protocol Listen Addresses:** Apague `default` e digite: `tcp://0.0.0.0:22000`
    
    - _(Isso força o protocolo TCP IPv4, que resolve problemas de desconexão)_.
        

![[Instalação Local Sync-1769539251887.webp|929x594]]


## 2. Adicionar a Pasta do Obsidian

1. Clique em **+ Add Folder** (Adicionar Pasta).
    
2. **Folder Label:** `SOTA System` (ou nome de sua preferência).
    
3. **Folder ID:** Copie este código gerado, você precisará dele ou o celular pedirá para aceitar.
    
4. **Folder Path:** Selecione a pasta onde estão seus `.md` (ex: `D:\SOTA V.1`).
    
![[Instalação Local Sync-1769539093585.webp]]


1. **Aba File Versioning (Versionamento):**
    
    - Escolha: **Staggered File Versioning** (Escalonado).
        
    - Isso é sua "Lixeira de Segurança" contra deletamentos acidentais.

![[Instalação Local Sync-1769539215448.webp]]
1. **Aba Advanced:**
    
    - **File Pull Order:** `Newest First` (Prioriza notas novas).
        
    -  **Ignore Permissions:** Marcar (Evita erros de permissão Windows vs Android).

![[Instalação Local Sync-1769539180285.webp]]

- Por ultimo Salve as Configurações

![[Instalação Local Sync-1769540868676.webp]]

---

## Passo 3: Configuração no Celular (Syncthing-Fork)

Abra o app. Dê permissão de "Localização" (necessário para o Android deixar usar o Wi-Fi no discovery) e "Arquivos".

![[Instalação Local Sync-1769543590578.webp|568x599]]

## 1. Otimização (Menu Superior Esquerdo > Configurações)

- **Comportamento (Behavior):**
    
    - Marque "Inicio automático" (Start on Boot).
        

![[Instalação Local Sync-1769543770647.webp|901x619]]

## Wi-Fi Configuração

Existem duas formas de configurar o Wi-Fi.

### 1° Opção: Wi-Fi Geral

- **Condições de Execução (Run Conditions):**
    -  **Executar no Wi-Fi:** Marque essa opção caso queira que o Sync funcione em qualquer tipo de WI-FI

![[Instalação Local Sync-1769543856893.webp]]
### 2° Opção: Whitelist de Wi-Fi

Ao marcar a opção **"Executar em redes WI-FI especificas"**, o Syncthing entrará automaticamente em **modo de pausa** até que você diga explicitamente em _quais_ redes ele pode funcionar.

**Siga os passos abaixo para liberar sua rede:**

1. Ainda na tela "Condições de Execução", habilite  a opção **"Executar em redes WI-FI especificas"**.
    
2. Logo abaixo clique em "Selecionar redes WI-FI" Toque nela. Uma lista com as redes Wi-Fi próximas aparecerá.
    
3. **Marque a caixa ✅** ao lado do nome do seu Wi-Fi de casa (e do trabalho, se desejar).
    
4. Se não fizer isso, o status ficará travado em "Sincronização Pausada" indefinidamente.
    

_Dica: Isso garante que o aplicativo não tente sincronizar gigabytes de dados enquanto você estiver num Wi-Fi público lento ou na rede da academia._

## Opções SyncThing

- Opções do Syncthing (Syncthing Options):
    
    - Desmarque Atravessia de NAT, Descoberta Global e Retransmissão 
        
    - ==Mantenha somente o Descoberta Local ativado.==

![[Instalação Local Sync-1769544604702.webp|610x646]]


---

## Passo 4: Conectar os Dispositivos (O "Aperto de Mão")

1. **No PC:** Ações > Show ID (Mostrar ID).

![[Instalação Local Sync-1769540940490.webp|945x556]]
1. **No Celular:** Aba Dispositivos > `+` > Ler QR Code do PC.
    
    - **Name:** `PC-XXX` (Coloque um nome que vc queira)
        
    - **Addresses:** Deixe `dynamic`.
        
    - Salve.
        

![[Instalação Local Sync-1769544742142.webp|765x541]]


2. **No PC:** Vai aparecer uma barra amarela "New Device". Clique **Add Device**.

![[Instalação Local Sync-1769541703467.webp|894x266]]

- Aba **Sharing**: Marque a pasta `SOTA System`.
- Salve.

![[Instalação Local Sync-1769541769837.webp]]

---

## Passo 5: Sincronizar a Pasta (O Final)

1. Após aceitar o dispositivo no PC e compartilhar a pasta, o **Celular** receberá uma notificação: _"O dispositivo PC quer compartilhar a pasta SOTA System"_.
    
2. Clique em **"Aceitar"** na notificação

![[Instalação Local Sync-1769544938019.webp]]

1. **Toque para configurar:**
    
    - **Folder Label:** `SOTA System`.
        
    - **Diretório:** Toque para escolher. **IMPORTANTE:**
        
        - Crie uma pasta na raiz interna: `/storage/emulated/0/SotaSystem`.
            
        - _Não use a pasta Downloads ou Documents para evitar bloqueios do Android._
            
2. Salve.

![[Instalação Local Sync-1769545050817.webp|568x600]]





## Resumo do Sucesso

- Seus dispositivos agora conversam via **TCP Puro** na rede local.
    
- Se você editar no celular, o PC atualiza dentro de 10 - 20 segundos.
    
- Se deletar algo sem querer, a pasta `.stversions` no PC salva sua vida.
    


---

## Alternativa para Usuários de iPhone (iOS)

O ecossistema da Apple (iOS) possui restrições de segurança (Sandbox) que impedem aplicativos de rodarem livremente em segundo plano como no Android. Por isso, não existe um app "Syncthing oficial".

Você tem três caminhos para seguir no iPhone:

### Opção 1: Möbius Sync (Para manter o sistema "SOTA" Local e Privado)
Este é um cliente de terceiros que conecta com o seu PC (SyncTrayzor) usando o mesmo protocolo que configuramos acima.
*   **Custo:** A versão gratuita é limitada a 20MB (apenas para teste). Para uso real, é necessário comprar a versão Pro (pagamento único, aprox. $5 USD).
*   **Como funciona:** Ele sincroniza seus arquivos com o PC via Wi-Fi.
*   **Limitação:** Devido às regras da Apple, a sincronização não é automática em segundo plano. Você precisa abrir o app Möbius Sync manualmente para "puxar" as atualizações antes de abrir seu Obsidian.
*   **Links Úteis:**
    *   [App Store: Möbius Sync](https://apps.apple.com/us/app/m%C3%B6bius-sync/id1539203216)

### Opção 2: iCloud Drive (Mais Prático, mas usa Nuvem)
Se você não quer pagar ou ter o trabalho de abrir o app de sync manualmente:
1.  Instale o **iCloud para Windows** no seu PC.
2.  Mova seu Vault do Obsidian para dentro da pasta `iCloud Drive`.
3.  No iPhone, o Obsidian já detecta e sincroniza nativamente.

### Opção 3: Obsidian Sync (Oficial e Pago)
O serviço oficial dos criadores do Obsidian.
*   **Custo:** Assinatura mensal ($8 - $10 USD/mês).
*   **Vantagem:** Funciona perfeitamente em qualquer dispositivo sem configuração complexa. Criptografia ponta-a-ponta garantida.

> **Nota sobre Privacidade Extrema:** Se o controle total, código aberto e "Zero Nuvem" são críticos para você e você não quer pagar assinaturas, a recomendação técnica é utilizar um dispositivo **Android**, que permite controle total do sistema de arquivos e sincronização real em segundo plano gratuitamente.


---

## Suporte

> [!HELP] **Travou ou algo deu errado?**
> Sincronização local pode ter detalhes técnicos chatos (Firewall, permissões, bateria...). Se você encontrar erros estranhos ou não conseguir conectar, não perca tempo batendo cabeça.
>
> Criei um **Especialista em Suporte (IA)** treinado especificamente para ler as documentações técnica do Syncthing e Obsidian para resolver problemas de conexão LAN, conflitos e configuração.
>
> 👉 **[Clique aqui para falar com o S.O.T.A Sync Specialist](https://www.perplexity.ai/spaces/suporte-s-o-t-a-local-sync-spe-A4xlyeEITaeaxGuwmDs2SA)**
