export type CrystallizeFailureReason =
  | 'missing_url'
  | 'timeout'
  | 'paywall'
  | 'empty'
  | 'unsupported';

export type StartCrystallizeRequest = {
  queueItemId: string;
};

export type StartCrystallizeResponse =
  | {
      conversationId: string;
      queueItemId: string;
      mode: 'seeded';
    }
  | {
      conversationId: string;
      queueItemId: string;
      mode: 'awaiting_manual_paste';
      reason: CrystallizeFailureReason;
    };

export type ManualCrystallizeRequest = {
  conversationId: string;
  queueItemId: string;
  pastedText: string;
};

export type CrystallizeMetadata = {
  crystallize: {
    queue_item_id: string;
    source_title: string;
    source_url: string | null;
    source_domain: string | null;
    status: 'seeded' | 'awaiting_manual_paste';
    failure_reason?: CrystallizeFailureReason;
    notes_present: boolean;
  };
};
