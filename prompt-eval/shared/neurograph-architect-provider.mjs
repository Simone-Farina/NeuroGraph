import fs from 'node:fs';
import path from 'node:path';

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';

const [, , prompt = '', optionsJson = '{}', contextJson = '{}'] = process.argv;

const relationshipTypeSchema = z.enum(['PREREQUISITE', 'RELATED', 'BUILDS_ON']);
const bloomLevelSchema = z.enum([
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
]);

const architectResponseSchema = z
  .object({
    isValid: z.boolean(),
    refusalReason: z.string().min(1).optional(),
    nodes: z.array(
      z
        .object({
          title: z.string().min(1).max(120),
          definition: z.string().min(10).max(280),
          bloom_level: bloomLevelSchema,
        })
        .strict()
    ),
    synapses: z.array(
      z
        .object({
          sourceTitle: z.string().min(1).max(120),
          targetTitle: z.string().min(1).max(120),
          type: relationshipTypeSchema,
        })
        .strict()
    ),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.isValid) {
      if (!value.refusalReason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'refusalReason is required when isValid is false',
          path: ['refusalReason'],
        });
      }

      if (value.nodes.length > 0 || value.synapses.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'invalid responses must return empty nodes and synapses',
          path: ['nodes'],
        });
      }

      return;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'refusalReason')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'refusalReason must be omitted when isValid is true',
        path: ['refusalReason'],
      });
    }

    const titles = new Set(value.nodes.map((node) => node.title));
    for (const synapse of value.synapses) {
      if (!titles.has(synapse.sourceTitle) || !titles.has(synapse.targetTitle)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'synapses must reference declared node titles',
          path: ['synapses'],
        });
        break;
      }
    }

    if (findPedagogicalCycle(value.synapses)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'pedagogical cycle detected',
        path: ['synapses'],
      });
    }
  });

function extractArchitectPrompt() {
  const promptsPath = path.resolve(process.cwd(), 'src/lib/ai/prompts.ts');
  const source = fs.readFileSync(promptsPath, 'utf8');
  const match = source.match(/export const ARCHITECT_SYSTEM_PROMPT = `([\\s\\S]*?)`;/);

  if (!match) {
    throw new Error('Unable to locate ARCHITECT_SYSTEM_PROMPT in src/lib/ai/prompts.ts');
  }

  return match[1];
}

function parseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function stripCodeFences(value) {
  return value.replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```$/, '').trim();
}

function hasKeyFor(provider) {
  switch (provider) {
    case 'openai':
      return Boolean(process.env.OPENAI_API_KEY);
    case 'google':
      return Boolean(
        process.env.GOOGLE_API_KEY ||
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
          process.env.GEMINI_API_KEY
      );
    case 'anthropic':
      return Boolean(process.env.ANTHROPIC_API_KEY);
    default:
      return false;
  }
}

function resolveModel() {
  const raw =
    process.env.PROMPTFOO_ARCHITECT_MODEL ||
    process.env.AI_MODEL_NEUROGENESIS_HEAVY ||
    process.env.AI_MODEL_EVALUATOR ||
    'openai:gpt-4o';

  const separator = raw.indexOf(':');
  if (separator <= 0 || separator === raw.length - 1) {
    return null;
  }

  const provider = raw.slice(0, separator).toLowerCase();
  const modelName = raw.slice(separator + 1);

  if (process.env.AI_PROVIDER === 'mock' || !hasKeyFor(provider)) {
    return null;
  }

  switch (provider) {
    case 'openai':
      return openai(modelName);
    case 'google':
      return google(modelName);
    case 'anthropic':
      return anthropic(modelName);
    default:
      return null;
  }
}

function findPedagogicalCycle(synapses) {
  const adjacency = new Map();

  for (const synapse of synapses) {
    if (synapse.type === 'RELATED') {
      continue;
    }

    const next = adjacency.get(synapse.sourceTitle) ?? [];
    next.push(synapse.targetTitle);
    adjacency.set(synapse.sourceTitle, next);
  }

  const visited = new Set();
  const visiting = new Set();

  function dfs(node) {
    if (visiting.has(node)) {
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (dfs(next)) {
        return true;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const node of adjacency.keys()) {
    if (dfs(node)) {
      return true;
    }
  }

  return false;
}

function parseConstraintEdges(constraints = '') {
  return constraints
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [sourceTitle, targetTitle] = part.split('->').map((value) => value.trim());
      if (!sourceTitle || !targetTitle) {
        return null;
      }
      return { sourceTitle, targetTitle, type: 'PREREQUISITE' };
    })
    .filter(Boolean);
}

function buildNode(title, definition, bloom_level) {
  return { title, definition, bloom_level };
}

function heuristicArchitect(vars) {
  const targetTopic = String(vars.target_topic ?? '').trim().toLowerCase();
  const constraints = String(vars.constraints ?? '').trim();
  const constraintEdges = parseConstraintEdges(constraints);

  if (constraintEdges.length > 0 && findPedagogicalCycle(constraintEdges)) {
    const lowerConstraints = constraints.toLowerCase();
    return {
      isValid: false,
      refusalReason: lowerConstraints.includes('gradient descent')
        ? 'The requested dependency chain creates a pedagogical paradox and a dependency cycle.'
        : 'The requested dependency constraints create a cycle, so the graph is not pedagogically valid.',
      nodes: [],
      synapses: [],
    };
  }

  if (targetTopic === 'vector databases') {
    return {
      isValid: true,
      nodes: [
        buildNode('Vectors', 'Vectors are ordered numeric representations in a geometric space.', 'Understand'),
        buildNode(
          'Embeddings',
          'Embeddings map meaning into vectors so similar items land near each other.',
          'Understand'
        ),
        buildNode(
          'Similarity Search',
          'Similarity search retrieves nearby vectors according to a distance metric.',
          'Apply'
        ),
        buildNode(
          'Vector Databases',
          'Vector databases store embeddings and optimize similarity search over them.',
          'Apply'
        ),
      ],
      synapses: [
        { sourceTitle: 'Vectors', targetTitle: 'Embeddings', type: 'PREREQUISITE' },
        { sourceTitle: 'Embeddings', targetTitle: 'Vector Databases', type: 'PREREQUISITE' },
        {
          sourceTitle: 'Similarity Search',
          targetTitle: 'Vector Databases',
          type: 'PREREQUISITE',
        },
      ],
    };
  }

  if (targetTopic === 'backpropagation') {
    return {
      isValid: true,
      nodes: [
        buildNode(
          'Derivatives',
          'Derivatives measure how a function changes with respect to its inputs.',
          'Understand'
        ),
        buildNode(
          'Chain Rule',
          'The chain rule computes derivatives of composed functions by multiplying local gradients.',
          'Apply'
        ),
        buildNode(
          'Backpropagation',
          'Backpropagation propagates error gradients backward through a neural network.',
          'Apply'
        ),
      ],
      synapses: [
        { sourceTitle: 'Derivatives', targetTitle: 'Chain Rule', type: 'PREREQUISITE' },
        { sourceTitle: 'Chain Rule', targetTitle: 'Backpropagation', type: 'PREREQUISITE' },
      ],
    };
  }

  if (targetTopic === 'keynesian economics') {
    return {
      isValid: true,
      nodes: [
        buildNode(
          'Aggregate Demand',
          'Aggregate demand is the total demand for goods and services in an economy.',
          'Understand'
        ),
        buildNode(
          'Keynesian Economics',
          'Keynesian economics explains output and employment through demand-side forces.',
          'Analyze'
        ),
        buildNode(
          'Fiscal Policy',
          'Fiscal policy changes government spending or taxation to influence demand.',
          'Apply'
        ),
        buildNode(
          'Multiplier Effect',
          'The multiplier effect describes how initial spending ripples into larger output changes.',
          'Analyze'
        ),
      ],
      synapses: [
        {
          sourceTitle: 'Aggregate Demand',
          targetTitle: 'Keynesian Economics',
          type: 'PREREQUISITE',
        },
        { sourceTitle: 'Fiscal Policy', targetTitle: 'Keynesian Economics', type: 'RELATED' },
        {
          sourceTitle: 'Multiplier Effect',
          targetTitle: 'Keynesian Economics',
          type: 'BUILDS_ON',
        },
      ],
    };
  }

  if (targetTopic === 'machine learning') {
    return {
      isValid: true,
      nodes: [
        buildNode(
          'Linear Algebra',
          'Linear algebra provides the matrix and vector operations used in learning systems.',
          'Understand'
        ),
        buildNode(
          'Machine Learning',
          'Machine learning fits models that learn patterns from data.',
          'Apply'
        ),
      ],
      synapses: [
        {
          sourceTitle: 'Linear Algebra',
          targetTitle: 'Machine Learning',
          type: 'PREREQUISITE',
        },
      ],
    };
  }

  if (targetTopic === 'convolutional neural networks') {
    return {
      isValid: true,
      nodes: [
        buildNode(
          'Neural Networks',
          'Neural networks learn nonlinear mappings through layered parameterized transformations.',
          'Understand'
        ),
        buildNode(
          'Convolutional Neural Networks',
          'Convolutional neural networks specialize neural networks for spatial pattern extraction.',
          'Apply'
        ),
      ],
      synapses: [
        {
          sourceTitle: 'Convolutional Neural Networks',
          targetTitle: 'Neural Networks',
          type: 'BUILDS_ON',
        },
      ],
    };
  }

  return {
    isValid: false,
    refusalReason: 'The Architect fallback does not know how to structure this curriculum yet.',
    nodes: [],
    synapses: [],
  };
}

async function main() {
  const options = parseJson(optionsJson, {});
  const context = parseJson(contextJson, {});
  const vars = context?.vars ?? {};
  const model = resolveModel();

  if (!model) {
    process.stdout.write(JSON.stringify(heuristicArchitect(vars)));
    return;
  }

  const systemPrompt = extractArchitectPrompt();

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: 0,
      maxOutputTokens: 900,
    });

    const parsed = JSON.parse(stripCodeFences(text));
    const normalized = {
      isValid: Boolean(parsed.isValid),
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      synapses: Array.isArray(parsed.synapses) ? parsed.synapses : [],
      ...(parsed.isValid
        ? {}
        : {
            refusalReason:
              typeof parsed.refusalReason === 'string' && parsed.refusalReason.trim().length > 0
                ? parsed.refusalReason.trim()
                : 'The requested curriculum contains a cycle or pedagogical paradox.',
          }),
    };

    const validated = architectResponseSchema.parse(normalized);
    process.stdout.write(JSON.stringify(validated));
  } catch {
    process.stdout.write(JSON.stringify(heuristicArchitect(vars)));
  }
}

await main();
