# Integração com a API do Gemini

Este documento descreve como a integração com a Inteligência Artificial (Gemini) foi implementada neste projeto. Ele serve como guia para futuras manutenções e migrações.

## Arquitetura de Isolamento
A lógica de IA está isolada no arquivo:
- `/src/services/geminiService.ts`

Esse arquivo contém todos os prompts, esquemas de resposta (Response Schemas) e configurações de modelo.

## Configurações Atuais

### SDK Utilizado
- `@google/genai` (Google AI JavaScript SDK)

### Modelos Utilizados
- **Geração de Conteúdo:** `gemini-2.0-flash`
  - Este modelo foi escolhido por sua alta velocidade, suporte a `responseMimeType: "application/json"` e `responseSchema`.
  - **Atenção:** Em plataformas que não suportam a versão 2.0 ou 1.5 Flash, certifique-se de usar um modelo que suporte JSON mode.

### Parâmetros Técnicos
- **Response Schemas:** Utilizamos `responseSchema` para forçar a IA a retornar um objeto JSON válido com campos específicos (`title`, `topic`, `content`).
- **Geração Estruturada:** O prompt solicita explicitamente o uso de Markdown, parágrafos claros e separadores (---) para manter a integridade visual do app.

## Notas para Migração (Importante)
Se você for migrar para uma ferramenta que utiliza uma versão mais antiga do SDK:
1. Verifique se o método `ai.models.generateContent` existe.
2. Certifique-se de que a variável de ambiente `GEMINI_API_KEY` esteja configurada.
3. Se a nova plataforma tentar alterar a versão do modelo para `gemini-pro` (mais antigo), verifique se ele suporta o `responseSchema` definido no `geminiService.ts`. Caso não suporte, será necessário tratar o JSON manualmente a partir da string de resposta.

## Como Restaurar
Se a integração for quebrada, revise o arquivo `/src/services/geminiService.ts` e compare com os tipos definidos no esquemas criados pelo modelo para garantir que a tipagem coincida com o esperado pelo banco de dados (Firestore) e pelo estado do app (Zustand).
