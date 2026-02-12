export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
};

export type CrystallizationSuggestion = {
  title: string;
  definition: string;
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
};
