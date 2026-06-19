# Projeto Emodia

Pense comigo: Há um projeto de desenvolvimento web, banco de dados e inteligência artificial, onde o objetivo é o usuário se cadastrar e enviar imagens e tirar fotos através da página web, gravar áudios e gravar vídeos dentro da página e escrever textos. E a IA iria detectar e classificar nesses registros as seis emoções: alegria, tristeza, nojo, medo, raiva e surpresa. Além disso a IA buscaria as causas/origem dessas emoções através das palavras-chaves encontradas por ela, como: família, relacionamento, trabalho e etc. E os sistema iria armazenar essas informações e mídias num banco, porém para esse trabalho, é obrigatório ter duas versões, uma com banco relacional (MySQL, usar XAMPP) e não relacional (MongoDB), duas versões com esses bancos armazenando os dados. Quais tecnologias utilizaríamos, como:
padrões de projetos, arquitetura de software, APIs, tecnologias de IA, teriamos que usar conteirnerização como docker? autenticação, e outras coisas, tudo isso para esse projeto e no que seria mais adequado e seguindo os limites do hardware que será usado, que no caso é:
Lenovo LOQ 15IRH8, 12th Gen Intel® Core™ i5-12450H × 12, NVIDIA GeForce RTX 2050/PCIe/SSE2 / Mesa Intel® Graphics (ADL GT2) (4GB GPU vram), SO Zorin OS 17.3 Core, 512,1 GB SSD e 16GB ram

## **1. Tecnologias e Ferramentas do Projeto**

| **Categoria** | **Tecnologias / Padrões** | **Função no Projeto** | **Por que é adequado** |
| --- | --- | --- | --- |
| **Backend API** | Node.js + Express | API principal | Simples, rápido, fácil de manter e documentar |
| **IA Service** | FastAPI (Python) | Processar emoções, polaridade, confiança | Desempenho alto, ótimo para ML |
| **Arquitetura** | Ainda definir |  |  |
| **Padrões** | Repository Pattern | Trocar MySQL ↔ Mongo sem reescrever app | Evita retrabalho, limpa a lógica |
|  | DTO Pattern | Padronizar entrada/saída de dados | Facilita integração entre Node ↔ IA ↔ front |
|  | Factory Pattern (opcional) | Criar repositório conforme banco ativo | Automação e flexibilidade |
| **Banco versão 1 (OBIRGATORIO)** | MySQL (XAMPP) | Armazenar usuários, análises e mídias | Relacional, obrigatório no projeto |
| **Banco versão 2 (OBIRGATORIO)** | MongoDB | Armazenar os mesmos dados do MySQL | Flexível, ideal para mídias e JSON |
| **Autenticação** | JWT + bcrypt | Login seguro, tokens | Simples, padrão de mercado |
| **Segurança** | helmet + cors | Proteções básicas e controle de origem | Leve e essencial |
| **Uploads** | multer | Upload de foto, vídeo e áudio | Suporte nativo ao multipart/form-data |
| **Logs** | winston | Registro de erros e eventos | Facilita depuração |
| **Testes** | Jest (Node), Pytest (Python) | Testar lógica e modelos | Qualidade mínima garantida |
| **Front-end (OBIRGATORIO)** | HTML, CSS, JS puro | Interface e dashboard | Rápido, leve e obrigatório no escopo |
| **Captura de mídia** | MediaDevices API | Tirar fotos, gravar áudio e vídeo | Nativo do navegador |
| **Dashboard** | Chart.js | Exibir gráficos de emoções e polaridade | Simples e bonito |
| **Confiabilidade** | Softmax confidence, Entropy | Mostrar precisão da emoção detectada | Requisito importante do projeto |
| **Infraestrutura** | Docker (opcional) | Padronizar ambiente Node + IA + bancos | Se quiser mais nota / profissionalismo |
| **Documentação** | Swagger (Express), FastAPI Docs | Documentar endpoints | Transparência e organização |

---

### **📦 Infraestrutura / Organização**

| Área | Tecnologia | Função |
| --- | --- | --- |
| Versionamento | Git + GitHub | Controle de código |
| Ambiente | Conda | Gerenciamento de pacotes |
| Ambiente de dev | Cursor | Código e debug |
| Versionamento | Gitflow | tecnica gitflow |

---

DEVE SE CRIAR UM AMBIENTE CONDA “emodia” e instalar tudo oq precisa nele

# **2. Hardware disponível (seu PC)**

Com base no que você já mencionou:

| Componente | Seu Hardware |
| --- | --- |
| CPU | 12th Gen Intel® Core™ i5-12450H × 12 |
| GPU | NVIDIA GeForce RTX 2050/PCIe/SSE2 / Mesa Intel® Graphics (ADL GT2) 4GB VRAM |
| RAM | **16GB** |
| Armazenamento | **500 GB SSD** |
| SO | **Linux Zorin** |

---

# **3. Resumo do que o Emodia faz**

**O Emodia é um aplicativo que analisa emoções humanas através de:**

- **Texto (digita no próprio sistema)**
- **Áudio (grava no próprio sistema)**
- **Imagem (expressão facial) (pode enviar do seu computador e pode tirar foto no próprio sistema)**
- **Vídeo (webcam) (grava video no proprio sistema)**

Ele identifica emoções básicas, mistura de emoções, intensidade e gera insights emocionais.

### Funcionalidades principais

✔ Registrar e analisar emoções diariamente

✔ Receber feedback emocional por texto, voz ou imagem

✔ Identificar padrões emocionais

✔ Mostrar gráficos e evolução emocional

✔ Guardar tudo no histórico do usuário

- Detectar possíveis origens das emoções (família, relacionamento, trabalho e etc), identificar a polaridade de negativo e positivo e também a confiabilidade se aquela emoção tá certa

---

# **4. Emoções que vamos identificar**

### **6 emoções principais**

1. **Alegria**
2. **Tristeza**
3. **Raiva**
4. **Medo**
5. **Nojo**
6. **Ansiedade**

### **Emoções compostas (misturas de 2 OU IDENTIFICAR  A PRIMEIRA DEPOIS A SEGUNDA)**

Exemplos:

- Alegria + Tristeza
- Alegria + Raiva
- Alegria + Medo
- Alegria + Nojo
- Alegria + Ansiedade
- Tristeza + Raiva
- Tristeza + Medo
- Tristeza + Nojo
- Tristeza + Ansiedade
- Raiva + Medo
- Raiva + Nojo
- Raiva + Ansiedade
- Medo + Nojo
- Medo + Ansiedade
- Nojo + Ansiedade
