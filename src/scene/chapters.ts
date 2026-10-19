/** The page is one story told in chapters. Section ids, the progress rail and the 3D scene all read this list. */
export interface Chapter {
  readonly id: string
  readonly label: string
  /** Short number shown in the progress rail and section eyebrows. */
  readonly index: string
}

export const CHAPTERS = [
  { id: 'top', label: 'Tender', index: '00' },
  { id: 'problem', label: 'The problem', index: '01' },
  { id: 'fan-out', label: 'Fan out', index: '02' },
  { id: 'gate', label: 'The gate', index: '03' },
  { id: 'signature', label: 'The signature', index: '04' },
  { id: 'evidence', label: 'Evidence', index: '05' },
  { id: 'start', label: 'Start', index: '06' },
] as const satisfies readonly Chapter[]

export type ChapterId = (typeof CHAPTERS)[number]['id']

export const CHAPTER_IDS: readonly ChapterId[] = CHAPTERS.map((c) => c.id)
