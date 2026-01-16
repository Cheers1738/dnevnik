import { z } from "zod";

export const scenarioIdSchema = z.enum([
  "best-day-month",
  "person-changed-me",
  "moment-of-pride"
]);

export const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string()
});

export const artifactSchema = z.object({
  chapter_title: z.string(),
  chapter_text: z.string(),
  quotes: z.array(z.string()).length(5)
});

export const llmRequestSchema = z.object({
  messages: z.array(messageSchema),
  mode: z.enum(["interview", "support", "digitize"]),
  scenarioId: scenarioIdSchema.optional()
});

export type ScenarioId = z.infer<typeof scenarioIdSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type LlmRequest = z.infer<typeof llmRequestSchema>;

export const scenarios = [
  {
    id: "best-day-month",
    title: "Лучший день месяца",
    prompts: [
      "Какой момент этого дня был самым ярким?",
      "Что помогло тебе почувствовать радость?",
      "Как бы ты сохранил этот опыт на будущее?"
    ]
  },
  {
    id: "person-changed-me",
    title: "Человек, который изменил меня",
    prompts: [
      "Кто этот человек и как вы познакомились?",
      "Какое влияние он или она оказали на тебя?",
      "Как ты выражаешь благодарность за этот опыт?"
    ]
  },
  {
    id: "moment-of-pride",
    title: "Момент гордости",
    prompts: [
      "Что произошло в этот момент?",
      "Какие качества помогли тебе справиться?",
      "Как этот опыт влияет на твои планы сейчас?"
    ]
  }
] as const;
