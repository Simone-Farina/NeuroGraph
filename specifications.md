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

6. FSRS — SPACED REPETITION ENGINE (Post-MVP / Planned Enhancement)
Status: APPROVED — Replace SM-2 with FSRS before Task 10 implementation
Priority: HIGH — Implement FSRS directly instead of SM-2 to avoid future migration
Reference Paper: "A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling" (Ye et al., ACM KDD 2022)
Reference Implementation: ts-fsrs (MIT) — https://github.com/open-spaced-repetition/ts-fsrs
Algorithm Spec: https://expertium.github.io/Algorithm.html

6.1 Motivazione: Perché FSRS al posto di SM-2
SM-2 (SuperMemo 2, 1987) è un algoritmo pionieristico ma limitato:
- Un solo parametro per carta (ease_factor) che soffre di "ease hell" — le carte difficili restano intrappolate a intervalli minimi.
- Nessun modello esplicito di memoria: l'intervallo è calcolato come `interval × ease_factor`, senza fondamento scientifico sulla curva dell'oblio.
- Nessuna validazione empirica moderna.

FSRS (Free Spaced Repetition Scheduler, 2022-2026) è il suo successore naturale:
- Basato sul modello DSR (Difficulty, Stability, Retrievability) con fondamenta nelle neuroscienze computazionali.
- 21 parametri globali ottimizzabili, validati su 220 milioni di log di memoria (dataset MaiMemo).
- 12.6% di miglioramento prestazionale rispetto all'algoritmo a soglia (threshold scheduling) nei benchmark.
- Curva dell'oblio power-law (più accurata dell'esponenziale per dati reali).
- Mean reversion sulla difficoltà: previene l'ease hell.
- Adottato da Anki (v23.10+) come scheduler predefinito.

6.2 Il Modello di Memoria DSR
FSRS modella la memoria con tre variabili di stato:

Difficulty (D ∈ [1, 10]):
Resistenza alla consolidazione. Materiale più complesso ha D più alto, il che riduce l'incremento di stabilità ad ogni review.

Stability (S):
Forza di immagazzinamento della memoria. Definita come il tempo (in giorni) necessario affinché la retrievability scenda dal 100% al 90%.
- S alta = oblio lento. S bassa = oblio rapido.
- Dopo ogni review, S viene ricalcolata in base a D, S precedente, R, e il voto.

Retrievability (R ∈ [0, 1]):
Forza di recupero della memoria. Probabilità attuale di ricordare il concetto.
Calcolata tramite la forgetting curve power-law (FSRS-6):
$R(t, S) = \left(1 + factor \cdot \frac{t}{S}\right)^{-w_{20}}$
dove $factor = 0.9^{-1/w_{20}} - 1$ per garantire $R(S, S) = 90\%$.

Nota: La curva power-law approssima meglio la sovrapposizione di più tracce mnemoniche esponenziali rispetto a una singola esponenziale pura. Questo è il motivo principale per cui FSRS supera SM-2 nei benchmark.

6.3 Le Formule Chiave (FSRS-6)

6.3.1 Stabilità iniziale dopo la prima review
$S_0(G) = w_{G-1}$
I primi 4 parametri (w0–w3) corrispondono alla stabilità iniziale per ciascun voto (Again, Hard, Good, Easy).

6.3.2 Difficoltà iniziale dopo la prima review
$D_0(G) = w_4 - e^{w_5 \cdot (G - 1)} + 1$
dove w4 è la difficoltà quando il primo voto è "Again".

6.3.3 Aggiornamento della difficoltà
Dopo ogni review:
$\Delta D(G) = -w_6 \cdot (G - 3)$
$D' = D + \Delta D \cdot \frac{10 - D}{9}$ (linear damping — previene D = 10 esatto)
$D'' = w_7 \cdot D_0(4) + (1 - w_7) \cdot D'$ (mean reversion — previene ease hell)
Effetto pratico: Again/Hard aumentano D, Good non lo cambia, Easy lo diminuisce.

6.3.4 Nuova stabilità dopo review riuscita (Hard/Good/Easy)
$S'_r = S \cdot SInc$
dove SInc (Stability Increase) è:
$SInc = e^{w_8} \cdot (11 - D) \cdot S^{-w_9} \cdot (e^{w_{10} \cdot (1 - R)} - 1) \cdot w_{15|16}(G) + 1$
Proprietà fondamentali di SInc:
- D alta → SInc basso (materiale difficile cresce più lentamente)
- S alta → SInc basso (la stabilità tende a saturare — stabilization decay)
- R bassa → SInc alto (ripassare quando stai per dimenticare è più efficace — spacing effect)
- SInc ≥ 1 sempre (la stabilità non può diminuire dopo una review riuscita)
w15 è applicato se G = Hard (riduce SInc), w16 se G = Easy (amplifica SInc).

6.3.5 Nuova stabilità dopo lapse (Again)
$S'_f = \min(S, w_{11} \cdot D^{-w_{12}} \cdot ((S+1)^{w_{13}} - 1) \cdot e^{w_{14} \cdot (1-R)})$
La stabilità post-lapse è sempre ≤ stabilità pre-lapse.

6.3.6 Stabilità dopo same-day review (FSRS-5+)
$S' = S \cdot e^{w_{17} \cdot (G - 3 + w_{18})} \cdot S^{-w_{19}}$
Per le review fatte lo stesso giorno, l'impatto è maggiore quando S è piccolo e decresce logaritmicamente.

6.3.7 Calcolo dell'intervallo
$I(DR, S) = \frac{S}{factor} \cdot \left(DR^{1/DECAY} - 1\right)$
dove DR = Desired Retention (default 90%). Quando DR = 90%, l'intervallo è uguale alla stabilità.

6.4 Parametri Default (FSRS-6)
[0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542]
Questi 21 parametri funzionano bene per la maggior parte degli utenti senza ottimizzazione personalizzata. L'ottimizzazione per-utente richiede ~1000 reviews ed è una feature post-MVP.

6.5 Mapping: Schema Attuale → Schema FSRS

6.5.1 Colonne da mantenere (semantica invariata)
- stability (number) → S di FSRS. Stessa semantica, diversa formula di aggiornamento.
- retrievability (number) → R di FSRS. Stessa semantica, diversa forgetting curve.
- last_review (Date) → Invariato. Usato per calcolare t (tempo trascorso).
- next_review_due (Date) → Invariato. Calcolato tramite I(DR, S).
- review_count (number) → Invariato. Conteggio totale delle review.

6.5.2 Colonne da rimuovere
- ease_factor (number) → RIMOSSO. FSRS non usa ease factor. Sostituito da difficulty + le 21 w globali.
- consecutive_correct (number) → RIMOSSO dal calcolo SRS. Mantenuto opzionalmente per statistiche UI.

6.5.3 Colonne da aggiungere
TypeScript// Nuovi campi nella Crystal entity
type CrystalFSRSFields = {
  difficulty: number;        // D ∈ [1, 10] — resistenza alla consolidazione
  state: 'New' | 'Learning' | 'Review' | 'Relearning'; // Stato della carta FSRS
  reps: number;              // Review riuscite consecutive (usato internamente da FSRS)
  lapses: number;            // Totale lapse (voto "Again") — indicatore di materiale problematico
  elapsed_days: number;      // Giorni dall'ultima review (cache per performance)
  scheduled_days: number;    // Giorni pianificati per la prossima review
};

6.5.4 Migrazione Database (SQL)
ALTER TABLE crystals ADD COLUMN difficulty REAL NOT NULL DEFAULT 5.0;
ALTER TABLE crystals ADD COLUMN state TEXT NOT NULL DEFAULT 'New';
ALTER TABLE crystals ADD COLUMN reps INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crystals ADD COLUMN lapses INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crystals ADD COLUMN elapsed_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crystals ADD COLUMN scheduled_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crystals DROP COLUMN ease_factor;
-- consecutive_correct mantenuto per statistiche ma non usato da FSRS

6.6 Integrazione con ts-fsrs
Dependency: ts-fsrs (npm, MIT license, https://github.com/open-spaced-repetition/ts-fsrs)

6.6.1 Inizializzazione
TypeScriptimport { fsrs, FSRS, Card, Rating, State } from 'ts-fsrs';
const scheduler: FSRS = fsrs({
  // Parametri default FSRS-6 — funzionano senza ottimizzazione
  request_retention: 0.9,  // Desired Retention = 90%
  maximum_interval: 36500, // Max 100 anni (effettivamente illimitato)
  enable_short_term: true, // Supporto same-day reviews
});

6.6.2 Scheduling di una review
TypeScriptfunction scheduleReview(crystal: Crystal, rating: Rating, now: Date) {
  const card: Card = {
    due: new Date(crystal.next_review_due),
    stability: crystal.stability,
    difficulty: crystal.difficulty,
    elapsed_days: crystal.elapsed_days,
    scheduled_days: crystal.scheduled_days,
    reps: crystal.reps,
    lapses: crystal.lapses,
    state: mapState(crystal.state),
    last_review: crystal.last_review ? new Date(crystal.last_review) : undefined,
  };
  const result = scheduler.repeat(card, now);
  const scheduled = result[rating]; // { card: Card, log: ReviewLog }
  // Aggiorna crystal nel database con i nuovi valori da scheduled.card
  return {
    stability: scheduled.card.stability,
    difficulty: scheduled.card.difficulty,
    next_review_due: scheduled.card.due,
    state: scheduled.card.state,
    reps: scheduled.card.reps,
    lapses: scheduled.card.lapses,
    elapsed_days: scheduled.card.elapsed_days,
    scheduled_days: scheduled.card.scheduled_days,
    retrievability: scheduled.card.last_review
      ? calculateRetrievability(scheduled.card)
      : 1.0,
  };
}

6.6.3 Calcolo Retrievability (per decay visualization)
TypeScriptfunction calculateRetrievability(card: Card, now: Date = new Date()): number {
  if (!card.last_review || card.state === State.New) return 1.0;
  const t = (now.getTime() - card.last_review.getTime()) / (1000 * 60 * 60 * 24); // giorni
  const factor = Math.pow(0.9, -1 / 0.1542) - 1; // w20 = 0.1542 (default)
  return Math.pow(1 + factor * t / card.stability, -0.1542);
}
Nota: ts-fsrs espone anche un metodo get_retrievability() che calcola questo internamente.

6.6.4 Mapping dei Voti
I voti della review UI mappano direttamente ai Rating FSRS:
- "Again" → Rating.Again (1) — Lapse. Stabilità resettata, difficoltà aumenta.
- "Hard" → Rating.Hard (2) — Riuscito ma difficile. Intervallo conservativo.
- "Good" → Rating.Good (3) — Riuscito normalmente. Intervallo standard.
- "Easy" → Rating.Easy (4) — Riuscito facilmente. Intervallo aggressivo, difficoltà diminuisce.

6.7 Impatto sulle Feature Esistenti

6.7.1 Decay Visualization (Sezione 5 — Nodi Grafo)
Il calcolo di R cambia formula (power-law invece di esponenziale) ma la logica UI resta identica:
- Fresh (R > 0.9): Cyan glow, piena opacità
- Stable (R 0.7–0.9): Luminosità normale
- Fading (R 0.5–0.7): Tono ambra, leggermente sbiadito
- Decaying (R 0.3–0.5): Ambra/arancio, animazione tremolante
- Critical (R < 0.3): Rosso, animazione pulsante, tooltip "Review recommended"

6.7.2 Blocking Mechanic (Sezione 4.2)
La soglia critica R < 0.85 per il soft-locking dei nodi figli diventa più accurata con FSRS:
la curva power-law riflette meglio la reale probabilità di recall, quindi il blocco si attiva al momento giusto, né troppo presto né troppo tardi.

6.7.3 FIRe — Fractional Implicit Repetition (Post-MVP)
FSRS apre possibilità per FIRe che SM-2 non offre:
- Quando un utente completa un task complesso, la stabilità dei nodi prerequisito può essere aggiornata con un "bonus" proporzionale al peso dell'edge nel grafo.
- Questo è modellabile come una review implicita con R artificialmente alto, usando le formule di SInc.
- Richiede ricerca e sperimentazione — non includere nell'MVP.

6.7.4 Desired Retention Personalizzabile (Post-MVP)
FSRS supporta nativamente il concetto di Desired Retention (DR):
- DR = 90% (default): bilanciamento standard tra retention e carico di review.
- DR = 95%: più review, ma si ricorda quasi tutto. Utile per nodi prerequisito critici.
- DR = 80%: meno review, accettando più dimenticanze. Utile per nodi "nice to know".
- Potenziale feature: DR automatico basato sulla posizione nel grafo — nodi con molti figli (alta centralità) ricevono DR più alto.

6.8 Roadmap di Ottimizzazione (Fasi Future)

Fase 1 (MVP): Parametri default FSRS-6
- I 21 parametri default funzionano bene per il 90% degli utenti.
- Nessuna infrastruttura di training necessaria.
- Implementazione: integrare ts-fsrs con parametri default.

Fase 2 (Post-MVP): Ottimizzazione per-utente
- Dopo ~1000 reviews, l'utente ha abbastanza dati per ottimizzare i parametri.
- ts-fsrs-optimizer (Python) o fsrs-rs (Rust/WASM) possono calcolare parametri personalizzati.
- UX: bottone "Optimize my parameters" nella pagina impostazioni.
- Storage: 21 float per utente nella tabella users.

Fase 3 (Future): SSP-MMC Scheduling Ottimale
- L'algoritmo SSP-MMC del paper KDD 2022 tratta lo scheduling come un problema di cammino minimo stocastico.
- Obiettivo: minimizzare il costo totale di memorizzazione (tempo speso in review) per raggiungere una stabilità target.
- Richiede una matrice di policy π*[d][h] precalcolata che mappa (difficulty, half-life) → intervallo ottimale.
- Potenziale: 12.6% di miglioramento rispetto al threshold scheduling standard.
- Complessità: richiede simulazione Monte Carlo e discretizzazione dello spazio degli stati.
- Prerequisito: dataset significativo (~10.000+ review log per utente) per calibrare il modello DHP.

6.9 Riferimenti Scientifici
- Ye, J. et al. (2022). "A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling." ACM KDD 2022. http://www.maimemo.com/paper/
- Wozniak, P. (1990). "Application of a computer to improve the results of student study." (SM-2 originale)
- Wozniak, P. "Three component model of memory." SuperMemo Guru. https://supermemo.guru/wiki/Three_component_model_of_memory
- Expertium. "A technical explanation of FSRS." https://expertium.github.io/Algorithm.html
- Open Spaced Repetition. FSRS Algorithm Wiki. https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm

NOTE PER LO SVILUPPO
Priorità MVP:
Chat funzionale (Vercel AI SDK).
Visualizzazione Grafo (React Flow) side-by-side.
Logica di "Trigger" (Mockata all'inizio, poi AI-driven).
Persistenza Nodi (Database).
Spaced Repetition: FSRS-6 via ts-fsrs (sostituisce SM-2 nel piano originale).
Non Prioritario per ora: Auth complessa, pagamenti, social features, ottimizzazione parametri per-utente.