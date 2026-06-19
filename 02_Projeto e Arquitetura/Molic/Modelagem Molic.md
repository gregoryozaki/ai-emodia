# **Uso da Modelagem Molic no Projeto EMODIA**

O projeto EMODIA se beneficia da metodologia Molic (Modelagem de Interfaces Colaborativas) para detalhar a interação do usuário e o fluxo de trabalho do sistema, garantindo que as interfaces não apenas cumpram as funções necessárias, mas também ofereçam uma experiência de usuário (UX) coesa e alinhada às regras de negócio e segurança, como a LGPD.
O Molic é ideal para o EMODIA, pois ele permite mapear as regras de negócio, os pré-condições (precond), os resultados garantidos (gco) e as mudanças de estado (d: / sc:) que ocorrem no *backend* a partir das ações do usuário (*u:*) no *frontend*.


--- 


<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1qUH5Lg37UwWANIe_jEXmoeQY-zuY5DCS" height="500"  width="400"/>
</p>


---




**1. Modelagem do Fluxo de Atividades Central**
A modelagem Molic no EMODIA foca no fluxo crítico, desde o acesso até a geração do *feedback* emocional e de risco:
**Acesso e Cadastro (US01, US02, US14)**
• **Acesso à Plataforma:** É o estado inicial para usuários não autenticados.
    ◦ **Pré-condição (precond):** `{Usuário não autenticado}`.
    ◦ **Ação do Usuário (u:):** `realizar login/cadastro` ou `iniciar recuperação de senha`.
    ◦ **Resultado Garantido (gco):** `Acesso concedido` (se credenciais válidas).
    ◦ **Mudança de Estado (d:):** `set {Usuário: logado}` e `aceitouTermo` (US03).
****Registro e Análise de Conteúdo (US04, US05, US06, US07)
• **Descrever / Enviar Conteúdo:** Representa a tela principal de registro.
    ◦ **Ação do Usuário (u:):** `selecionar tipo de mídia/escrever texto` (limitado pelo `GestorUso` - US10/US25).
    ◦ **Ação do Usuário (u:):** `confirmar envio`.
    ◦ **Mudança de Estado (d:):** `registro armazenado` (Mídia ou Texto salvo no banco).
• **Análise de Sentimentos e Risco:** É a atividade que ocorre no *backend* (IA).
    ◦ **Mudança de Estado (d:):** `set {Emoção: Tipo, Confiança: %, Causa: Contexto}` (US07).
**Geração de Feedback e Alerta (US08, US09, US11)**
• **Avaliar Risco / Persistência?:** É o ponto de decisão (Decisão de Alerta).
    ◦ **Caminho "Sim":** Ocorre se a análise indicar Risco Urgente (US11: Confiança > 80%) ou Persistência Negativa (US09: > 14 dias).
        ▪ **Atividade:** **Emitir Alerta Urgente**.
        ▪ **Mudança de Estado (d:):** `Exibir mensagem ética e contatos de emergência`.
        ▪ **Ação do Usuário (u:):** `interagir com alerta` (o alerta é prioritário e não pode ser ignorado - US11 RN).
    ◦ **Caminho "Não":** Se não houver risco ou persistência.
        ▪ **Atividade:** **Gerar Relatórios / Dashboard**.
        ▪ **Resultado Garantido (gco):** `Relatório pronto` (Visualização ou Download em PDF - US08).
****

**2. Estados de Controle (SC) e Resultados Garantidos (gco)**
A força do Molic reside na clareza com que ele define o que o sistema deve garantir e o estado do sistema após cada interação, o que é crucial para EMODIA, especialmente em relação à segurança e integridade de dados:**Elemento MolicContexto no EMODIAUS RelacionadaPré-condição (precond)**O usuário deve ter idade mínima de 18 anos para o Cadastro.US01**Resultado Garantido (gco)**Após a análise, o Dashboard deve ser exibido com o resumo da última semana.US20**Mudança de Estado (d:)**O sistema armazena a nota de segurança (`d: sinais de risco registrados`) e o registro fica imutável após 5 minutos.US11, US15**Estado de Controle (sc:)**O *sc:* `Nota de registro armazenada` permite o **loop** de volta ao **Registro de Emoção**, indicando que o ciclo de análise foi concluído e o usuário pode iniciar um novo registro.US04, US25
