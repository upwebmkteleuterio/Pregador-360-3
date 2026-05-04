# Regras de Desenvolvimento - Pregador 360

Este documento define a stack tecnológica e as regras de implementação para este projeto. Todas as futuras modificações devem seguir estas diretrizes.

## Tech Stack (Resumo)

*   **Framework:** React 19 com TypeScript.
*   **Build Tool:** Vite.
*   **Estilização:** Tailwind CSS v4 (utilizando a nova engine `@tailwindcss/vite`).
*   **Gerenciamento de Estado:** Zustand (com middleware de persistência).
*   **Roteamento:** React Router v7.
*   **IA:** Google Gemini SDK (`@google/genai`) utilizando modelos Flash (2.0/3.0).
*   **Animações:** Motion (Framer Motion).
*   **Ícones:** Lucide React.
*   **Banco de Dados Local:** IndexedDB (via `src/lib/audioDb.ts`) e LocalStorage (via Zustand).

## Regras de Uso de Bibliotecas

| Finalidade | Biblioteca / Ferramenta | Regra de Uso |
| :--- | :--- | :--- |
| **UI Components** | shadcn/ui | Sempre priorize componentes do shadcn. Não reinvente botões ou modais básicos. |
| **Ícones** | Lucide React | Use exclusivamente Lucide. Mantenha consistência no `strokeWidth` (padrão 2). |
| **Estado Global** | Zustand | Use o store central em `src/store/useStore.ts`. Evite múltiplos stores pequenos. |
| **Integração IA** | `@google/genai` | Toda lógica de prompt deve residir em `src/services/`. Use `responseSchema` para JSON estruturado. |
| **Estilização** | Tailwind CSS | Proibido o uso de CSS Modules ou Styled Components. Use classes utilitárias e variáveis do `@theme`. |
| **Animações** | `motion` | Use para transições de página e estados de entrada/saída de modais (AnimatePresence). |
| **Markdown** | `react-markdown` | Use para renderizar o conteúdo gerado pela IA para garantir formatação correta. |

## Arquitetura de Pastas

*   `src/components/`: Componentes reutilizáveis e UI (shadcn).
*   `src/pages/`: Páginas completas da aplicação.
*   `src/services/`: Chamadas de API e lógica de serviços externos (IA).
*   `src/store/`: Definições de estado global.
*   `src/constants/`: Prompts, templates e configurações estáticas.

## Diretrizes de Código

1.  **Idioma:** A interface do usuário (UI) deve ser sempre em **Português (PT-BR)**. O código (variáveis, funções) deve ser em **Inglês**.
2.  **Responsividade:** O design é "Mobile First". Garanta que todos os modais e layouts funcionem perfeitamente em telas pequenas.
3.  **Clean Code:** Mantenha componentes focados. Se um arquivo de página passar de 250 linhas, considere refatorar partes em sub-componentes.
4.  **Segurança:** Chaves de API devem ser lidas de `process.env.GEMINI_API_KEY` (configurado via Vite).