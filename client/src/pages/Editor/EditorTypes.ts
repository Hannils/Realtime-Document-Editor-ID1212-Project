import { BaseEditor, Operation, NodeOperation, BaseSetSelectionOperation, TextOperation } from 'slate'
import { HistoryEditor } from 'slate-history'
import { ReactEditor } from 'slate-react'

type Leaf = { text: string; bold?: true; italic?: true }

type Paragraph = { type: 'paragraph'; children: Leaf[] }
type H1 = { type: 'h1'; children: Leaf[] }
type Ul = { type: 'ul'; children: Leaf[] }
type Ol = { type: 'ol'; children: Leaf[] }
type Li = { type: 'li'; children: Leaf[] }

export type Element = Paragraph | H1 | Ul | Ol | Li
export type Text = Leaf

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: Paragraph | H1 | Ul | Ol | Li
    Text: Leaf
  }
}

export type CustomOperation = Operation & {
  remote?: boolean
}