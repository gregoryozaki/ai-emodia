## Diagrama Entidade-Relacionamento (DER) Conceitual no EMODIA ##



O Diagrama Entidade-Relacionamento (DER) Conceitual é uma ferramenta de modelagem de dados fundamental que descreve a estrutura da informação e o esquema do banco de dados necessário para o funcionamento do projeto EMODIA. Ele foca na representação das entidades de interesse, seus atributos e os relacionamentos entre elas, independentemente da tecnologia de banco de dados a ser utilizada.


## Mapeamento da Lógica de Negócio para o DER
Para o EMODIA, o DER Conceitual traduz diretamente os requisitos do sistema em entidades de dados, garantindo que a informação crítica seja armazenada de forma consistente:

Entidades Centrais: Define as entidades primárias do sistema, que refletem os requisitos funcionais e de análise:

Usuário: Armazena dados pessoais, de autenticação e configurações de privacidade (US01, US22, US23).

RegistroEmocional: Representa o conteúdo enviado pelo usuário (texto, URL da mídia, data, hora, tipo) (US04, US05, US06).

AnaliseEmocional: Armazena o resultado do processamento da IA (emoção classificada, percentual de confiança, causas prováveis, indicador de risco) (US07, US11).

Alerta: Armazena os eventos críticos disparados (tipo de alerta, data, status) (US09, US11, US24).

GestorUso: Controla os limites e contadores de registro semanais do usuário (US10, US25).

Relacionamentos (Cardinalidade): O DER especifica as regras de negócio de como essas entidades se conectam. Por exemplo:

Um Usuário pode ter N (muitos) RegistroEmocionais, mas cada Registro pertence a apenas um Usuário (1:N).

Cada RegistroEmocional gera exatamente uma AnaliseEmocional (1:1).

Integridade e Segurança: Ao definir claramente os atributos e as chaves primárias, o DER Conceitual assegura a integridade dos dados e suporta os requisitos não funcionais, como a criptografia de dados sensíveis e o gerenciamento de privacidade (LGPD - US03), antes de qualquer implementação no banco de dados (MongoDB, por exemplo).

O DER Conceitual é, portanto, o plano de fundo lógico que valida e orienta a criação do Diagrama de Classes UML (estrutura do software) e a arquitetura do Contêiner Banco de Dados (Nível 2 do C4).

---


<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=15kDi7DQp8yUCoEm8-vpi2-gAC0ulS62B" height="600"  width="800"/>
</p>
