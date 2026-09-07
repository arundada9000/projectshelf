/* ============================================================
   Guide Content Model

   Guides are structured data rather than free-form markup. That
   keeps them type-checked, lets one renderer style every guide
   consistently, and makes it possible to derive HowTo and Article
   structured data from the same source the reader sees.
   ============================================================ */

export type GuideCategory = 'setup' | 'workflows' | 'configuration' | 'data';

export interface GuideBlock_Paragraph {
  type: 'paragraph';
  text: string;
}

export interface GuideBlock_Heading {
  type: 'heading';
  text: string;
  /** Used for the in-page contents list. */
  id: string;
}

export interface GuideBlock_List {
  type: 'list';
  ordered?: boolean;
  items: string[];
}

export interface GuideBlock_Code {
  type: 'code';
  /** Shown above the block, e.g. "Windows Terminal". */
  caption?: string;
  code: string;
}

export interface GuideBlock_Note {
  type: 'note';
  tone?: 'info' | 'warning';
  text: string;
}

/** A field-by-field table, used for "put this in that box" instructions. */
export interface GuideBlock_Fields {
  type: 'fields';
  caption?: string;
  rows: { field: string; value: string }[];
}

/**
 * A numbered procedure. These become HowTo steps in structured data,
 * so only use them for genuine instructions.
 */
export interface GuideBlock_Steps {
  type: 'steps';
  steps: { name: string; text: string; code?: string }[];
}

export type GuideBlock =
  | GuideBlock_Paragraph
  | GuideBlock_Heading
  | GuideBlock_List
  | GuideBlock_Code
  | GuideBlock_Note
  | GuideBlock_Fields
  | GuideBlock_Steps;

export interface Guide {
  slug: string;
  title: string;
  /** Meta description and the summary shown on the index. */
  description: string;
  category: GuideCategory;
  /** ISO date, used for article metadata. */
  updated: string;
  readingMinutes: number;
  /** Short phrases describing who this is for. */
  audience: string[];
  blocks: GuideBlock[];
  /** Slugs of related guides. */
  related?: string[];
}

export const CATEGORY_LABELS: Record<GuideCategory, string> = {
  setup: 'Setup',
  workflows: 'Workflows',
  configuration: 'Configuration',
  data: 'Your data',
};

export const CATEGORY_ORDER: GuideCategory[] = [
  'setup',
  'configuration',
  'workflows',
  'data',
];
