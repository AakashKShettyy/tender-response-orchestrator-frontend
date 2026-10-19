/**
 * All page copy, typed in one place.
 *
 * Rule: nothing here may state a measured result. The project publishes numbers only from saved evaluation
 * reports, so the page describes what the system is built to do and what is in place, never how well it scored.
 * `copy.test.ts` enforces this (no percentages, no "x faster" claims).
 */

export interface Cta {
  readonly label: string
  readonly href: string
  readonly kind: 'primary' | 'ghost'
  /** A call to action that is not live yet is shown as unavailable instead of linking to nothing. */
  readonly disabled?: boolean
}

export const brand = {
  name: 'Tender Response Orchestrator',
  short: 'TRO',
} as const

export const nav = {
  links: [
    { label: 'Problem', href: '#problem' },
    { label: 'Agents', href: '#fan-out' },
    { label: 'Review', href: '#gate' },
    { label: 'Evidence', href: '#evidence' },
  ],
  cta: { label: 'Follow one tender', href: '#problem', kind: 'primary' } satisfies Cta,
} as const

export const hero = {
  eyebrow: 'Multi-agent tender response',
  title: 'One tender. A team of agents. Nothing leaves without a signature.',
  lede: 'Hand it a 100-question tender. Specialist agents answer in parallel, every claim points to its source, and a person signs off before anything is sent.',
  ctas: [
    { label: 'Follow one tender', href: '#problem', kind: 'primary' },
    { label: 'How it stays honest', href: '#evidence', kind: 'ghost' },
  ] satisfies readonly Cta[],
  chips: ['Cited answers', 'Human sign-off', 'Evaluation first', 'Synthetic data only'],
  scrollHint: 'Scroll to follow a tender through the system',
} as const

export const problem = {
  eyebrow: '01 · The tender',
  title: 'A hundred questions. Four teams. One expired certificate.',
  body: [
    'A customer sends a tender. The answers live in old tenders, policies, rate sheets and certificates, and sales chases pricing, compliance and operations by email.',
    'Along the way, "48-hour delivery" on page three becomes "24-hour" on page nine, and a certificate that lapsed in March gets quoted as valid.',
  ],
  exampleLabel: 'Question 14',
  exampleQuestion: 'Do you hold a valid dangerous-goods handling certification?',
  exampleBad: 'A plain model: "Yes, we are certified."',
  exampleGood: 'This system: "The source expired in March. Held for a person."',
} as const

export interface AgentCard {
  readonly name: string
  readonly role: string
  readonly rule: string
  /** CSS colour token for the card accent. */
  readonly tone: 'copper' | 'cyan' | 'violet'
}

export const fanOut = {
  eyebrow: '02 · Fan out',
  title: 'The Planner reads. Specialists work in parallel.',
  body: 'Each question is classified and routed. Pricing, Compliance and Operations answer at the same time, and each can read only its own documents.',
  agents: [
    {
      name: 'Pricing',
      role: 'Rates and commercial terms',
      rule: 'Numbers come from a lookup in the rate table. The model only phrases them.',
      tone: 'copper',
    },
    {
      name: 'Compliance',
      role: 'Certificates, insurance, policies',
      rule: 'Every certificate is checked against its expiry date before it is quoted.',
      tone: 'cyan',
    },
    {
      name: 'Operations',
      role: 'Transit, claims, handling',
      rule: 'No access to pricing files. Permissions are enforced in code, not in a prompt.',
      tone: 'violet',
    },
  ] satisfies readonly AgentCard[],
  footnote: 'An orchestrator, plain code and not a chatting model, owns the budget, the retries and the failures.',
} as const

export const gate = {
  eyebrow: '03 · The gate',
  title: 'Review can say no.',
  body: 'A fluent answer can hide a problem. Code checks look for the ones that matter, and a held question goes to a person with the reason attached.',
  checks: [
    { label: 'Expired source', outcome: 'Held for a person' },
    { label: 'Two documents disagree', outcome: 'Held for a person' },
    { label: 'A promise the company must not make', outcome: 'Held for a person' },
    { label: 'A number that is not in the cited source', outcome: 'Sent back, up to three tries' },
  ],
  footnote: 'Every quoted source must literally exist in a retrieved passage. Anything that cannot be verified is dropped.',
} as const

export const signature = {
  eyebrow: '04 · The signature',
  title: 'A person decides. Then it ships.',
  body: 'Edit, approve, or send back with a comment. Approved answers are locked, every decision lands in a tamper-evident audit log, and export stays blocked until every answer is approved.',
  chips: ['Tamper-evident audit log', 'Word and PDF export', 'Learns from edits, only after approval'],
} as const

export const evidence = {
  eyebrow: '05 · Evidence',
  title: 'Built to be measured, not just demoed.',
  body: 'The point of the project is an honest comparison: does a team of agents beat one well-built agent, and which parts earn their cost?',
  inPlace: [
    { title: 'A baseline', text: 'One agent with every document and tool, answering every question.' },
    { title: 'The full team and its ablations', text: 'Without review, without the loop, without the writer, without learning, and with one generalist instead of three.' },
    { title: 'A planted-trap dataset', text: 'Five seeded synthetic tenders with an answer key for every question.' },
    { title: 'A scorer no model touches', text: 'Grading is deterministic code, so a result cannot be argued with.' },
  ],
  traps: [
    'Expired certificate',
    'Conflicting documents',
    'Unanswerable question',
    'Ambiguous question',
    'Forbidden promise',
    'Rate-table lookup',
    'Lane not in the table',
    'Prompt injection',
  ],
  trapsLabel: 'Traps planted in every tender',
  status: 'Status: first real-model runs are in progress. Numbers are published only from saved reports, with the model named.',
} as const

export const stack = ['FastAPI', 'LangGraph', 'PostgreSQL + pgvector', 'Server-Sent Events', 'OpenAPI', 'React', 'Framer Motion', 'Three.js'] as const

export const finale = {
  eyebrow: '06 · Start',
  title: 'Tender in. Signed-off response out.',
  body: 'A recorded demo on synthetic data is on its way. Until then, the architecture and the evaluation method are the best place to start.',
  ctas: [
    { label: 'See the evidence', href: '#evidence', kind: 'primary' },
    { label: 'Recorded demo: coming soon', href: '#start', kind: 'ghost', disabled: true },
  ] satisfies readonly Cta[],
} as const

export const footer = {
  line: 'Synthetic data only. No real tenders, customers or shipments.',
  credit: 'Built by Aakash Shetty',
} as const
