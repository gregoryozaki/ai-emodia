## Uso do Diagrama Entidade-Relacionamento (DER) Lógico no EMODIA

O Diagrama Entidade-Relacionamento (DER) Lógico é o passo intermediário entre o modelo conceitual (a estrutura da informação) e o modelo físico (a implementação no banco de dados). Ele foca na estrutura do banco de dados relacional e define detalhadamente as tabelas, as colunas (atributos), as chaves primárias e as chaves estrangeiras.

## Propósito e Estrutura no EMODIA
O DER Lógico traduz as entidades conceituais do EMODIA (Usuário, RegistroEmocional, AnaliseEmocional, Alerta, GestorUso) em tabelas otimizadas, seguindo as regras de normalização e preparadas para a implementação no MongoDB ou outro sistema de gestão de banco de dados (SGBD) relacional/não relacional.

- Definição de Tabelas e Chaves: O modelo lógico define as tabelas baseadas nas entidades e estabelece as chaves primárias (PK) para identificação única (ex: ID_Usuario) e as chaves estrangeiras (FK) para manter a integridade referencial.

- Relações e Integridade: As relações 1:N (um para muitos), como a relação entre Usuário e RegistroEmocional, são resolvidas e representadas de forma explícita através da migração da chave primária (ex: ID_Usuario é incluído como FK na tabela RegistroEmocional).

- Implementação de Atributos: Os atributos (colunas) são definidos com seus tipos de dados lógicos (e.g., String, Date, Boolean, Integer), preparando o esquema para a criação das coleções/tabelas.

O DER Lógico é crucial para o EMODIA, pois garante que as Regras de Negócio, como a ligação correta de cada análise de IA ao seu respectivo registro e usuário, sejam mantidas através de chaves, permitindo consultas e relatórios eficientes (US08) e seguras.

--- 

<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=18KEGlt4w_kHq_AgOM25bGFFMrjmnLyMw" height="600"  width="800"/>
</p>
