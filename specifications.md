NEUROGRAPH – TECHNICAL & PRODUCT SPECIFICATIONSVersion: 1.0 (MVP Definition)
Status: Blueprint
Core Philosophy: "Organic Discovery $\rightarrow$ Crystallized Knowledge $\rightarrow$ Rigorous Retention"

1. VISIONE E CONCETTO DI PRODOTTO
NeuroGraph è una piattaforma di Mastery Learning Generativo.
A differenza dei corsi tradizionali (struttura top-down imposta) o delle note personali (struttura bottom-up caotica), NeuroGraph ibrida i due approcci.

1.1 Il Ciclo "Gas-to-Crystal"
L'esperienza utente si basa su tre stati della materia cognitiva:
Stato Gassoso (Chat & Discovery): L'utente esplora liberamente argomenti tramite conversazione naturale con l'AI. È la fase di curiosità, simile a Zettelkasten o Obsidian.
Transizione di Fase (Crystallization Trigger): Un sistema di background monitora la "densità concettuale". Quando l'utente raggiunge un insight (comprensione profonda), il sistema solidifica quel momento in un Nodo.
Stato Solido (Graph & Retention): Il Nodo diventa parte permanente del Grafo di Conoscenza (Knowledge Graph). Da quel momento, è soggetto a leggi di decadimento mnemonico (Forgetting Curve) e deve essere mantenuto attivo tramite esercizi (Active Recall).

1.2 Obiettivi Pedagogici (Math Academy Principles)
Atomicità: Ogni nodo rappresenta un singolo concetto indivisibile (es. "Puntatori in C" e non "Corso di C").Dipendenza Rigida (DAG): Non è possibile sbloccare un nodo se i nodi padre (prerequisiti) non sono in stato "Mastered".
Non-Interferenza: La spiegazione teorica è separata dalla verifica. La verifica è bloccante.
Fractional Implicit Repetition (FIRe): Eseguire un task complesso ricarica automaticamente la memoria dei concetti semplici sottostanti (trickle-down effect).

2. ARCHITETTURA TECNICA (STACK 2026)

2.1 Frontend (The Experience)
Framework: Next.js 15 (App Router). Utilizzo estensivo di React Server Components (RSC) per ridurre il carico client.
Graph Rendering Engine: MVP: React Flow. Ottimo per interattività, custom nodes e drag-and-drop.Future Scale: Sigma.js o Cosmograph (WebGL) per gestire >10.000 nodi.
State Management: Zustand. Per gestire lo stato locale dell'interfaccia (chat aperta/chiusa, selezione nodo) senza complessità eccessiva.
Generative UI: Vercel AI SDK (Core) + React Server Components. L'AI non streamma solo testo, ma streamma componenti UI interi (es. un quiz interattivo, un editor di codice) direttamente nella chat.Styling: TailwindCSS + Framer Motion (essenziale per le animazioni di "nascita" dei nodi).

2.2 Backend & Orchestration
Runtime: Node.js (su Vercel Serverless Functions).
AI Orchestration:Vercel AI SDK: Per la gestione dello streaming e dei tool calls.
Custom Agent Pipeline: Una pipeline che analizza la chat in parallelo senza bloccare la risposta all'utente.

2.3 Data Layer (Hybrid Persistence)L'architettura dati è complessa e richiede tre tipologie di storage:
Graph Database (La Struttura): Neo4j (o Memgraph).
Memorizza i Nodi (Concept) e le Relazioni (DEPENDS_ON, RELATED_TO).
Essenziale per query ricorsive: "Trovami tutti i nodi sbloccabili dato che l'utente ha masterato X e Y".
Vector Database (Il Contenuto): Pinecone (o pgvector).
Memorizza gli embedding del contenuto dei nodi.Scopo: De-duplicazione. Prima di creare un nodo "Cicli For", il sistema controlla semanticamente se esiste già un nodo simile per evitare ridondanze.Relational Database (Lo Stato): PostgreSQL (via Supabase o Neon).
Memorizza UserProgress, DecayLogs, Auth.3. DATA MODEL SPECIFICATIONS (SCHEMA)

3.1 Entity: KnowledgeNodeOgni "atomo" di conoscenza nel grafo ha questa struttura:TypeScripttype KnowledgeNode = {
  id: string;               // UUID
  title: string;            // Es: "Dopamine Prediction Error"
  definition: string;       // Sintesi concettuale (max 280 chars)
  
  // Pedagogical Metadata
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  complexity_score: number; // 0.0 - 1.0
  
  // Content & Resources
  core_insight: string;     // Il "takeaway" fondamentale estratto dalla chat
  resources: Resource[];    // Link curati (Youtube, Papers) trovati dall'AI
  
  // Generative UI Hint
  preferred_widget: 'code_editor' | 'quiz_multiple_choice' | 'conceptual_diagram' | 'flashcard';
};
3.2 Entity: Relationship (Edge)TypeScripttype Relationship = {
  source_id: string;
  target_id: string;
  type: 'HARD_PREREQUISITE' | 'SOFT_ENABLER' | 'RELATED_CONCEPT';
  weight: number; // Quanto è forte il legame (usato per l'algoritmo FIRe)
};
3.3 Entity: UserNodeState (State of Mind)
Questo è il record dinamico per ogni utente su ogni nodo.
TypeScripttype UserNodeState = {
  user_id: string;
  node_id: string;
  
  status: 'LOCKED' | 'DISCOVERED' | 'LEARNING' | 'MASTERED';
  
  // Spaced Repetition Variables (Math Academy style)
  stability: number;       // Giorni prima che il ricordo svanisca
  retrievability: number;  // Probabilità attuale di ricordare (1.0 - 0.0)
  last_review: Date;
  next_review_due: Date;
  
  consecutive_correct_answers: number;
};

4. FUNCTIONAL LOGIC & ALGORITHMS

4.1 The "Crystallization Trigger" Algorithm
Come il sistema decide di creare un nodo dalla chat.
Input: Finestra di contesto degli ultimi 10 messaggi (chat_history).
Processo:Topic Modeling: L'AI estrae i concetti chiave discussi.
Depth Check: Assegna un punteggio di profondità (0-10) basato sulla tassonomia di Bloom.
Esempio: "Cos'è un array?" -> Punteggio 2 (Remember) -> NO NODE.
Esempio: "Quindi l'array è più veloce della lista perché la memoria è contigua e riduce i cache miss?" -> Punteggio 8 (Analyze/Evaluate) -> CREATE NODE.
Duplication Check: Query vettoriale su Pinecone. Se similarità > 0.9 con un nodo esistente -> Aggiorna nodo esistente (Reinforcement), non crearne uno nuovo.
Ghost Branching: Al momento della creazione, l'AI ipotizza 3 nodi futuri ("Ghost Nodes") e li mostra in trasparenza per stimolare il "Rabbit Hole".

4.2 The "Decay & Review" Algorithm
Come il sistema gestisce l'oblio.
Formula: Ispirata a SuperMemo-2 modificato con logica Math Academy.
Decay: Ogni giorno, la retrievability di un nodo Mastered scende.$R = e^{-\frac{t}{S}}$ (dove $t$ è il tempo trascorso, $S$ è la stabilità).
Blocking Mechanic: Se la retrievability di un nodo Prerequisite scende sotto 0.85 (Soglia Critica), tutti i nodi figli diventano Locked (Greyed Out).
UX: L'utente non può imparare cose nuove finché non "ripara" le fondamenta.

4.3 Generative UI System
Il sistema non usa template statici.
Quando l'utente deve interagire con un nodo, l'AI genera le props per i componenti React.
Component Registry:
ConceptVisualizer: Per diagrammi (Mermaid/React Flow).
CodeSandbox: Editor Monaco con test case nascosti.
SocraticChat: Chat modale specifica per interrogazione.
QuizCard: Per rapid fire questions (Active Recall).

5. UI/UX GUIDELINES (AESTHETICS)Tema: "Dark Neural". 
Sfondo #0a0a0a, accenti neon (Cyan/Purple).
Interazione Grafo:
Nodi Mastered: Luminosi, pulsanti.
Nodi Decay: Tremolanti o rossi.
Nodi Ghost: Opacità 30%, border dashed.
Transizioni: Nessun caricamento pagina. Tutto avviene tramite transizioni fluide (Shared Layout Animations). Quando una chat diventa un nodo, il testo deve visivamente "volare" dalla chat al canvas del grafo.

NOTE PER LO SVILUPPO
Priorità MVP:
Chat funzionale (Vercel AI SDK).
Visualizzazione Grafo (React Flow) side-by-side.
Logica di "Trigger" (Mockata all'inizio, poi AI-driven).
Persistenza Nodi (Database).
Non Prioritario per ora: Auth complessa, pagamenti, social features.