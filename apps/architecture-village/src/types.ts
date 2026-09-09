export type MetricKey = 'latency' | 'availability' | 'consistency' | 'throughput' | 'complexity';
export type Metrics = Record<MetricKey, number>;
export type Choice = {
  id: string; label: string; correct: boolean; feedback: string;
  effects: Partial<Metrics>; tags: string[]; next: string | null;
};
export type EncounterNode = { id: string; prompt: string; context: string; choices: Choice[] };
export type Encounter = {
  id: string; name: string; kind: 'fog' | 'scope' | 'ghost' | 'mimic' | 'golem' | 'mold' | 'ogre' | 'serpent' | 'dragon' | 'worm' | 'giant' | 'hydra' | 'titan';
  intro: string; start: string; nodes: EncounterNode[]; initial: Metrics;
  reflectionPrompt: string; timeLimitSeconds?: number;
};
export type QuizQuestion = { id: string; prompt: string; options: string[]; answer: number; explanation: string; tag: string };
export type LessonSection = { title: string; body: string; example: string; takeaway: string };
export type LearningModule = {
  id: string; villageId: string; title: string; place: string; spirit: string; icon: string; color: string;
  position: [number, number]; objectives: string[]; prerequisites: string[]; duration: number;
  source: string; sections: LessonSection[]; quiz: QuizQuestion[]; encounter: Encounter;
};
export type Village = {
  id: string; title: string; subtitle: string; description: string; color: string; biome: 'meadow' | 'coast' | 'highlands';
  moduleIds: string[]; boss: Encounter;
};
export type Curriculum = { version: 2; villages: Village[]; modules: LearningModule[] };
export type ModuleProgress = {
  lesson: boolean; lab: boolean; reflection: boolean;
  quizBest: number; quizAttempts: number; encounterBest: number; encounterAttempts: number;
  reflectionText: string; reflectionMode: 'speak' | 'write'; rubric: boolean[]; weakTags: string[];
};
export type BossProgress = { best: number; attempts: number; reflection: boolean; weakTags: string[] };
export type ProgressV2 = {
  version: 2; modules: Record<string, ModuleProgress>; bosses: Record<string, BossProgress>;
  legacyXP: number; updatedAt: string;
};
export type Route = {kind:'world'} | {kind:'village'; villageId:string; moduleId?:string} | {kind:'boss'; villageId:string};
