# Metodologia Silas Silva de Diagnostico Estrategico

Official product language:

- product: Diagnostico Estrategico de Perfil;
- methodology: Metodologia Silas Silva de Diagnostico Estrategico;
- structure: 8 Dimensoes Estrategicas.

The internal folder and package-style identifier `methodology-8d` is a legacy
technical identifier. It must not be used in public product copy.

## Profile types

- `business`
- `creator`

## 8 Dimensoes Estrategicas

1. `positioning`
2. `first_impression`
3. `authority`
4. `content`
5. `identity`
6. `conversion`
7. `relationship`
8. `opportunities`

## Business weights

| Dimension        | Weight |
| ---------------- | -----: |
| positioning      |     16 |
| first_impression |     14 |
| authority        |     14 |
| content          |     13 |
| identity         |     10 |
| conversion       |     17 |
| relationship     |      8 |
| opportunities    |      8 |

## Creator weights

| Dimension        | Weight |
| ---------------- | -----: |
| positioning      |     14 |
| first_impression |     12 |
| authority        |     13 |
| content          |     16 |
| identity         |     16 |
| conversion       |     10 |
| relationship     |     11 |
| opportunities    |      8 |

## Evidence rules

Every conclusion must separate observed evidence, declared information, strategic interpretation, and insufficient evidence. Inference must not be presented as fact.

Never invent followers, reach, engagement, revenue, conversion, performance, growth, metrics, or history that was not provided.

## Insufficient evidence

When a dimension has `insufficient_evidence`:

- no score is assigned;
- its weight is removed;
- evaluable dimensions are renormalized;
- the result is `partial`;
- the excluded dimensions are listed;
- overall confidence may decrease.

If fewer than five dimensions are evaluable, `requires_review` must be true.

## Deterministic rounding

All scores must come from the deterministic scoring engine. Narrative examples may explain the qualitative diagnosis, but they must not override the mathematical result.

The official rounding rule is `Math.round(score)` for every profile type.

For the approved `business_complete` fixture:

- weighted score: `58.38`;
- final score: `58`.

## Report delivery gate

A premium report cannot be delivered as completed while `requires_review` is true. The result may be stored, but final report delivery must be blocked.
