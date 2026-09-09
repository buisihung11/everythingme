export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  tag: string;
  scope: 'current' | 'retrieval';
};

export type ToolCard = {
  id: string;
  title: string;
  category: 'method' | 'diagram' | 'diagnostic' | 'contract' | 'data' | 'scaling' | 'cache' | 'partitioning' | 'resilience';
  symptom: 'requests are unclear' | 'requests are slow' | 'writes are duplicated' | 'queries are expensive' | 'systems are overloaded' | 'hot reads overload the source' | 'one data store no longer fits' | 'nodes change often' | 'regions cannot communicate';
  signal: string;
  method: string;
  steps: string[];
  tradeoff: string;
  verification: string;
};

export type SequenceChallenge = {
  kind: 'sequence';
  title: string;
  prompt: string;
  items: string[];
  answer: string[];
  observation: string;
  tag: string;
};
export type DiagnoseChallenge = {
  kind: 'diagnose';
  title: string;
  prompt: string;
  cases: Array<{ id: string; clue: string; answer: 'DNS' | 'Connection' | 'Application'; explanation: string; tag: string }>;
};
export type ContractChallenge = {
  kind: 'contract';
  title: string;
  prompt: string;
  fixes: Array<{ id: string; label: string; correct: boolean; explanation: string; tag: string }>;
};
export type DataChallenge = {
  kind: 'data';
  title: string;
  prompt: string;
  decisions: Array<{ id: string; label: string; correct: boolean; explanation: string; tag: string }>;
};
export type BottleneckChallenge = {
  kind: 'bottleneck';
  title: string;
  prompt: string;
  symptoms: Array<{ id: string; label: string; answer: 'cache' | 'queue' | 'scale-out'; explanation: string; tag: string }>;
};
export type CacheChallenge = {
  kind: 'cache';
  title: string;
  prompt: string;
  decisions: Array<{ id: string; label: string; correct: boolean; explanation: string; tag: string }>;
};
export type ShardChallenge = {
  kind: 'shard';
  title: string;
  prompt: string;
  candidates: Array<{ id: string; label: string; fit: 'strong' | 'weak' | 'danger'; explanation: string; tag: string }>;
};
export type RingChallenge = {
  kind: 'ring';
  title: string;
  prompt: string;
  events: Array<{ id: string; label: string; answer: 'few-keys' | 'many-keys' | 'skewed'; explanation: string; tag: string }>;
};
export type PartitionChallenge = {
  kind: 'partition';
  title: string;
  prompt: string;
  operations: Array<{ id: string; label: string; answer: 'CP' | 'AP' | 'Reconcile'; explanation: string; tag: string }>;
};
export type Challenge = SequenceChallenge | DiagnoseChallenge | ContractChallenge | DataChallenge | BottleneckChallenge | CacheChallenge | ShardChallenge | RingChallenge | PartitionChallenge;

export type VillageId = 'foundation' | 'distributed-highlands';

export type JourneyStop = {
  id: string;
  villageId: VillageId;
  order: number;
  title: string;
  place: string;
  problem: string;
  subtitle: string;
  duration: number;
  icon: string;
  color: string;
  spirit: string;
  position: [number, number];
  prerequisites: string[];
  story: string;
  clues: string[];
  beats: Array<{ title: string; body: string }>;
  diagram?: string;
  toolCardIds: string[];
  challenge: Challenge;
  quiz: QuizQuestion[];
};

export type FoundationVillage = {
  id: VillageId;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  color: string;
  biome: 'meadow' | 'coast' | 'highlands';
  stopIds: string[];
};

export type FinalIncident = {
  id: string;
  villageId: VillageId;
  title: string;
  summary: string;
  steps: Array<{ id: string; prompt: string; options: string[]; answer: number; explanation: string; tag: string }>;
};

export type Curriculum = {
  version: 4;
  villages: FoundationVillage[];
  stops: JourneyStop[];
  toolCards: ToolCard[];
  finalIncidents: FinalIncident[];
};

export type StopProgress = {
  challengeAttempts: number;
  quizBest: number;
  quizAttempts: number;
  completedAt: string | null;
  weakTags: string[];
};
export type FinalProgress = { best: number; attempts: number; weakTags: string[] };
export type ProgressV4 = {
  version: 4;
  stops: Record<string, StopProgress>;
  discoveredToolCards: string[];
  finalIncidents: Record<VillageId, FinalProgress>;
  lastVillageId: VillageId;
  updatedAt: string;
};

export type Route = { kind: 'village'; villageId: VillageId } | { kind: 'stop'; stopId: string } | { kind: 'final'; villageId: VillageId };

// Legacy aliases kept so old, now-unused teaching widgets still type-check while
// the v3 app path reads only JourneyStop/Curriculum above.
export type MetricKey = 'latency' | 'availability' | 'consistency' | 'throughput' | 'complexity';
export type Metrics = Record<MetricKey, number>;
export type Choice = { id: string; label: string; correct: boolean; feedback: string; effects: Partial<Metrics>; tags: string[]; next: string | null };
export type EncounterNode = { id: string; prompt: string; context: string; choices: Choice[] };
export type Encounter = { id: string; name: string; kind: 'fog' | 'scope' | 'ghost' | 'mimic' | 'golem' | 'mold' | 'ogre' | 'serpent' | 'dragon' | 'worm' | 'giant' | 'hydra' | 'titan'; intro: string; start: string; nodes: EncounterNode[]; initial: Metrics; reflectionPrompt: string; timeLimitSeconds?: number };
export type LessonSection = { title: string; body: string; example: string; takeaway: string };
export type LearningModule = JourneyStop & { objectives: string[]; source: string; sections: LessonSection[]; encounter: Encounter };
export type Village = FoundationVillage & { moduleIds: string[]; boss: Encounter };
export type ModuleProgress = { lesson: boolean; lab: boolean; reflection: boolean; quizBest: number; quizAttempts: number; encounterBest: number; encounterAttempts: number; reflectionText: string; reflectionMode: 'speak' | 'write'; rubric: boolean[]; weakTags: string[] };
export type BossProgress = { best: number; attempts: number; reflection: boolean; weakTags: string[] };
export type ProgressV2 = { version: 2; modules: Record<string, ModuleProgress>; bosses: Record<string, BossProgress>; legacyXP: number; updatedAt: string };
export type ProgressV3 = { version: 3; stops: Record<string, StopProgress>; discoveredToolCards: string[]; finalIncident: FinalProgress; updatedAt: string };
