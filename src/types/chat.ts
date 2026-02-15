export type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
};

export type RelationshipType = 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';

export type SuggestionInput = {
  title: string;
  definition: string;
  core_insight: string;
  bloom_level: string;
  related_crystals?: Array<{
    id: string;
    title?: string;
    relationship_type: RelationshipType;
  }>;
};

export type SuggestionToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  providerExecuted?: boolean;
  input?: SuggestionInput;
  state?: string;
  output?: unknown;
};

export type EdgeSuggestion = {
  source_crystal_id: string;
  target_crystal_id: string;
  target_title: string;
  type: RelationshipType;
  weight: number;
  confidence: 'medium';
  source: 'vector' | 'ai';
};

export type CreatedCrystalResponse = {
  crystal: {
    id: string;
    title: string;
    retrievability: number;
  };
  edges?: Array<{
    id: string;
    source_crystal_id: string;
    target_crystal_id: string;
    type: RelationshipType;
    weight?: number;
  }>;
  edge_suggestions?: EdgeSuggestion[];
};

export type EdgeUpsertResponse = {
  edge: {
    id: string;
    source_crystal_id: string;
    target_crystal_id: string;
    type: RelationshipType;
    weight: number;
  };
};
