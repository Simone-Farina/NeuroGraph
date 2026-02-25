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
  related_neurons?: Array<{
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

export type SynapseSuggestion = {
  source_neuron_id: string;
  target_neuron_id: string;
  target_title: string;
  type: RelationshipType;
  weight: number;
  confidence: 'medium';
  source: 'vector' | 'ai';
};

export type CreatedNeuronResponse = {
  neuron: {
    id: string;
    title: string;
    retrievability: number;
  };
  synapses?: Array<{
    id: string;
    source_neuron_id: string;
    target_neuron_id: string;
    type: RelationshipType;
    weight?: number;
  }>;
  synapse_suggestions?: SynapseSuggestion[];
};

export type SynapseUpsertResponse = {
  synapse: {
    id: string;
    source_neuron_id: string;
    target_neuron_id: string;
    type: RelationshipType;
    weight: number;
  };
};
