## Diagrama de Sequência (DS) no Projeto EMODIA ##

O Diagrama de Sequência (DS), pertencente à família de diagramas comportamentais da UML, é essencial para o EMODIA, pois ele detalha a ordem cronológica exata das interações e da troca de mensagens entre os objetos e contêineres do sistema para a execução de um cenário específico.

Enquanto o Diagrama de Classes mostra a estrutura estática e o Diagrama de Casos de Uso mostra o que o sistema faz, o Diagrama de Sequência mostra como a funcionalidade é realizada, passo a passo.

- Fluxo Crítico Modelado: Registro e Análise de Risco ## 
O DS é particularmente útil para modelar fluxos transacionais e assíncronos no EMODIA, como o ciclo de registro e análise de risco (US04, US07, US11):


- Orquestração de Microsserviços:
O diagrama detalha como o Frontend interage com o API Backend e como o API Backend coordena a comunicação com o Serviço de Análise IA (externo) e o MongoDB (banco de dados).


- Transações e Persistência: Ele mapeia a sequência de persistência de dados: primeiro o registro bruto é salvo e, em seguida, a análise da IA é recebida e salva, garantindo a integridade da informação.


- Fluxo de Alerta de Risco: O diagrama ilustra o ponto de decisão e o caminho crítico: se o resultado da análise de risco (US11) for positivo, a sequência de mensagens do API Backend até o Frontend é ativada, culminando na exibição imediata do Alerta Urgente ao Usuário.

Ao visualizar as linhas de vida (Lifelines) e as mensagens numeradas, o Diagrama de Sequência garante que a lógica de negócio do EMODIA seja implementada com precisão, especialmente onde o tempo e a ordem das operações (como o envio assíncrono para a IA) são cruciais para a segurança do usuário. 

--- 

<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=13TV7uDO4C0AI3KPHE5CSKzoaUqNuO1Xm" height="600"  width="800"/>
</p>

