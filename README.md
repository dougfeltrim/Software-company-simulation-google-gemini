# 🏢 AI Software Company Simulation

> **Create complete software projects with AI agents powered by Ollama, CrewAI, and local LLMs**

This project simulates a software company where multiple AI agents collaborate to develop complete projects, generating code and documentation ready for the client. Now with **local execution**, **GPU/CPU support**, and a **ChatGPT-like interface**!

## ✨ New Features

- 🚀 **Fully Local Execution** - Runs completely on your machine using Ollama
- 🤖 **CrewAI Integration** - Advanced multi-agent orchestration
- 💻 **GPU & CPU Support** - Automatic hardware detection and optimization
- 📊 **System Benchmark** - Automatically selects optimal models for your hardware
- 🎨 **ChatGPT-like Interface** - Modern web UI built with Gradio
- 🐳 **Docker Support** - Easy deployment with Docker Compose
- 🔧 **Flexible Configuration** - Customize models, temperature, and more

## 📋 Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Available Models](#available-models)
- [Architecture](#architecture)
- [Original Version](#original-version)
- [Contributing](#contributing)

## 🎯 Features

### AI Agents

The system includes 7 specialized AI agents that work in parallel:

1. **Product Manager** - Defines requirements, splits tasks for parallel work
2. **Software Architect** - Designs modular architecture with clear component boundaries
3. **Backend Developer** - Develops server-side components in parallel
4. **Frontend Developer** - Develops client-side components in parallel
5. **Integration Engineer** - Tests component connections and identifies integration issues
6. **QA Engineer** - Validates quality and coordinates issue resolution
7. **Technical Writer** - Documents everything clearly

### Technical Features

- ✅ **100% Local** - No API keys or cloud services needed
- ✅ **Parallel Agent Collaboration** - Agents work on different components simultaneously
- ✅ **Automatic Integration Testing** - Components are tested and integrated automatically
- ✅ **Collaborative Problem Solving** - Agents discuss and resolve integration issues together
- ✅ **Hardware Optimization** - Automatically detects and uses GPU if available
- ✅ **Model Selection** - Recommends best models for your hardware
- ✅ **Web Interface** - Easy-to-use ChatGPT-like interface
- ✅ **CLI Mode** - Command-line interface for automation
- ✅ **Docker Support** - Containerized deployment
- ✅ **Benchmark Tool** - Test your system capabilities

## 💻 Requirements

### Minimum Requirements

- **Docker** and **Docker Compose**
- **8GB RAM** (minimum)
- **20GB free disk space**
- **Linux, macOS, or Windows** with WSL2

### Recommended Requirements

- **16GB+ RAM**
- **NVIDIA GPU** with 6GB+ VRAM (optional, but recommended)
- **NVIDIA Container Toolkit** (for GPU support)

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- NVIDIA drivers (if using GPU)

## 🚀 Quick Start

### For Docker Users (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/dougfeltrim/Software-company-simulation-google-gemini.git
   cd Software-company-simulation-google-gemini
   ```

2. **Run setup**
   ```bash
   ./setup.sh
   ```

3. **Start the services**
   ```bash
   # Auto-detect GPU/CPU
   ./start.sh
   
   # Or force CPU mode
   ./start.sh cpu
   ```

4. **Pull a model**
   ```bash
   ./pull-model.sh llama3:3b
   ```

5. **Access the web interface at http://localhost:7860**

### For Local Python Users

```bash
pip install -r requirements.txt
ollama pull llama3:3b
python main.py interface
```

## 📖 Usage

### Web Interface
1. Access http://localhost:7860
2. Select a model from the dropdown
3. Enter your project description
4. Click "Generate Project"
5. Review output and download

### CLI Mode
```bash
python main.py cli --description "Build a calculator app"
```

### System Benchmark
```bash
python main.py benchmark
```

## 🤖 Available Models

- `llama3:8b` - Best quality (needs 8GB+ VRAM)
- `llama3:3b` - Recommended default
- `mistral:7b` - Excellent balance
- `phi3:mini` - Fast and efficient
- `gemma:2b` - Lightweight
- `tinyllama:1.1b` - Very fast (CPU)

## 🔧 Configuration

Edit `.env` file:
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3:3b
TEMPERATURE=0.7
PORT=7860
```

## 🔍 Troubleshooting

**Ollama not starting:**
```bash
docker ps
docker logs ollama
docker restart ollama
```

**Model not found:**
```bash
./pull-model.sh llama3:3b
```

**Out of memory:** Use a smaller model like `tinyllama:1.1b`

---

## 📖 Original Version

**Selecione o idioma desejado abaixo para visualizar as instruções completas em Português ou Inglês.**  

**Select the desired language below to view the full instructions in Portuguese or English.**

<details>
<summary><strong>Português (Brasil)</strong></summary>

## Ferramentas Necessárias
- Google Colab
- Chave da API do Google Gemini: Você pode obter sua chave em [https://ai.google.dev/gemini-api/docs/api-key?hl=pt-br](https://ai.google.dev/gemini-api/docs/api-key?hl=pt-br).

## Como Executar
1. No Google Colab, acesse o ícone de chave no menu lateral esquerdo.
2. Adicione um novo "secret" com o nome `GOOGLE_API_KEY` e cole sua chave da API no campo "valor".
3. Na variável `project_description`, substitua o valor pela descrição do software que deseja criar. Por exemplo:
   - "Desenvolver um script de calculadora para ser executado no terminal".

## Como Funciona
Este código Python simula uma empresa de software que utiliza diferentes agentes de IA (como Gerente de Produto, Arquiteto de Software, Desenvolvedor, Redator Técnico e Sintetizador de Projeto) para colaborar na criação de um projeto de software.

### Configuração Inicial
O código começa configurando a chave da API do Google Gemini, que é usada para interagir com o modelo de IA gemini-2.0-flash.

### Classe Agent
A classe `Agent` representa um membro da equipe de software. Cada agente possui:
- `name`: Um nome para o agente (por exemplo, "Gerente de Produto").
- `system_instruction`: Uma instrução que define o papel do agente e seu foco (por exemplo, "Você define os requisitos do software e a visão do produto."). Esta instrução é crucial para guiar o comportamento do modelo de IA.
- `history`: Uma lista para armazenar o histórico de interações (prompts e respostas) do agente.

O método `generate_response` é responsável por enviar um prompt ao modelo Gemini. Ele incorpora a `system_instruction` do agente para garantir que a resposta seja relevante ao seu papel, e define `max_output_tokens` para controlar o tamanho da resposta e `temperature` (0.7 para respostas mais focadas).

### Classe SoftwareCompany
A classe `SoftwareCompany` orquestra a colaboração entre os diferentes agentes.
- `__init__`: Inicializa a empresa criando instâncias de cada `Agent` com seus respectivos nomes e instruções.
- `generate_project(self, project_description, rounds=5)`: Este é o método principal que simula o processo de desenvolvimento do projeto.
  - Ele recebe uma `project_description` (descrição do projeto) e o número de `rounds` (rodadas de interação) para a colaboração.
  - Em cada rodada, os agentes (exceto o Project Synthesizer inicialmente) geram respostas com base na `current_task` (tarefa atual).
  - O Project Synthesizer entra em ação para consolidar as respostas dos outros agentes, criando uma nova `current_task` que avança o projeto.
  - Nas últimas rodadas (definido por `rounds - 2`), o código instrui o Developer a gerar o código Python e o Technical Writer a criar a documentação técnica, baseando-se na `current_task` e, no caso do redator, também no código gerado.
  - Finalmente, o Project Synthesizer faz uma consolidação final de todo o trabalho, incluindo o código e a documentação, para apresentar um "projeto final pronto para o cliente".

### Exemplo de Uso
No final do código, uma instância da `SoftwareCompany` é criada e o método `generate_project` é chamado com uma descrição de projeto (`project_description`) e um número de rodadas (`rounds`). O exemplo abaixo mostra apenas 1 rodada, mas aumentar esse número permitiria uma colaboração mais profunda e, teoricamente, um projeto mais completo.

```python
company = SoftwareCompany()
project_description = "Desenvolver um script de calculadora para ser executado no terminal"
final_code, final_documentation = company.generate_project(project_description, rounds=3) # Ajuste o número de rodadas conforme necessário
```

## O Que Este Código Demonstra?
Este código é um exemplo prático de como a inteligência artificial generativa pode ser usada para simular e automatizar fluxos de trabalho colaborativos. Ao atribuir papéis e responsabilidades distintas a cada agente de IA, o sistema pode gerar componentes de software (como código e documentação) de forma mais estruturada e relevante, imitando a interação de uma equipe humana. Ele explora o conceito de agentes autônomos trabalhando juntos para alcançar um objetivo comum.

</details>

<details>
<summary><strong>English</strong></summary>

## Project: Software Company Using AI Agents

This project simulates a software company where AI agents collaborate to develop a complete project, including the final code and its documentation, ready for the client.

### Required Tools
- Google Colab
- Google Gemini API Key: You can get your key at [https://ai.google.dev/gemini-api/docs/api-key](https://ai.google.dev/gemini-api/docs/api-key).

### How to Run
1. In Google Colab, access the key icon in the left-hand sidebar menu.
2. Add a new "secret" named `GOOGLE_API_KEY` and paste your API key into the "value" field.
3. In the `project_description` variable, replace the value with the description of the software you want to create. For example:
   - "Develop a calculator script to be executed in the terminal".

### How It Works
This Python code simulates a software company that uses various AI agents (such as Product Manager, Software Architect, Developer, Technical Writer, and Project Synthesizer) to collaborate on creating a software project.

#### Initial Setup
The code begins by configuring the Google Gemini API key, which is used to interact with the gemini-2.0-flash AI model.

#### Agent Class
The `Agent` class represents a member of the software team. Each agent has:
- `name`: A name for the agent (e.g., "Product Manager").
- `system_instruction`: An instruction that defines the agent's role and focus (e.g., "You define the software requirements and product vision."). This instruction is crucial for guiding the AI model's behavior.
- `history`: A list to store the agent's interaction history (prompts and responses).

The `generate_response` method is responsible for sending a prompt to the Gemini model. It incorporates the agent's `system_instruction` to ensure the response is relevant to its role and sets `max_output_tokens` to control the response length, and `temperature` (0.7 for more focused responses).

#### SoftwareCompany Class
The `SoftwareCompany` class orchestrates the collaboration among the different agents.
- `__init__`: Initializes the company by creating instances of each `Agent` with their respective names and instructions.
- `generate_project(self, project_description, rounds=5)`: This is the main method that simulates the project development process.
  - It takes a `project_description` and the number of rounds of interaction for the collaboration.
  - In each round, the agents (except the Project Synthesizer initially) generate responses based on the `current_task`.
  - The Project Synthesizer then consolidates the responses from the other agents, creating a new `current_task` that advances the project.
  - In the final rounds (defined by `rounds - 2`), the code instructs the Developer to generate the Python code and the Technical Writer to create the technical documentation, based on the `current_task` and, in the writer's case, also the code generated.
  - Finally, the Project Synthesizer performs a final consolidation of all the work, including code and documentation, to present a "final project ready for the client."

#### Example Usage
At the end of the code, a `SoftwareCompany` instance is created, and the `generate_project` method is called with a project description (`project_description`) and a number of rounds (`rounds`). The example below shows only 1 round, but increasing this number would allow for deeper collaboration and, theoretically, a more complete project.

```python
company = SoftwareCompany()
project_description = "Develop a calculator script to be executed in the terminal"
final_code, final_documentation = company.generate_project(project_description, rounds=3) # Adjust the number of rounds as needed
```

### What This Code Demonstrates
This code is a practical example of how generative artificial intelligence can be used to simulate and automate collaborative workflows. By assigning distinct roles and responsibilities to each AI agent, the system can generate software components (like code and documentation) in a more structured and relevant way, mimicking the interaction of a human team. It explores the concept of autonomous agents working together to achieve a common goal.

</details>