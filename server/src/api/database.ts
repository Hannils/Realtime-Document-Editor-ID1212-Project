import { auth } from 'firebase-admin'
import { UserIdentifier, UserRecord } from 'firebase-admin/auth'
import { Client, QueryResult } from 'pg'

import { Document, DocumentPreview } from '../util/Types'

async function toDocument(data: any): Promise<Document | null> {
  if (!data) return null

  const id = parseInt(data.id)
  const title: string = data.title
  const ownerString: string = data.owner
  const created_at = new Date(data.created_at)
  const modified: Date | undefined = !data.modified ? undefined : new Date(data.modified)
  const content: Array<Object> = JSON.parse(data.content)

  if (isNaN(id)) return null
  if (typeof title !== 'string' || typeof ownerString !== 'string') return null
  if (modified !== undefined && isNaN(modified.getTime())) return null
  if (isNaN(created_at.getTime())) return null
  if (!Array.isArray(content)) return null

  const owner = await auth().getUser(ownerString)

  return Object.freeze<Document>({
    id,
    title,
    owner,
    created_at,
    modified,
    content: data.content,
  })
}

function toDocumentPreview(data: any): DocumentPreview | null {
  if (!data) return null

  data.id = parseInt(data.id)
  data.created_at = new Date(data.created_at)
  if (data.modified) {
    data.modified = new Date(data.modified)
  }

  if (isNaN(data.id)) return null
  if (typeof data.title !== 'string') return null
  if (data.modified !== null && isNaN(data.modified)) return null
  if (isNaN(data.created_at)) return null

  return Object.freeze<DocumentPreview>({
    id: data.id,
    title: data.title,
    modified: data.modified,
    created_at: data.created_at,
  })
}

async function toCollaborators(data: any[]) {
  const collaboratorIds: string[] = data.map((row) => row.user_id)
  const result = await auth().getUsers(collaboratorIds.map((uid) => ({ uid })))

  return result.users
}

interface DatabaseDocument {
  title: string
  modified?: Date
  created_at: Date
  owner: string
  content: string
}

function toDatabaseDocument({
  content,
  owner,
  ...doc
}: Omit<Document, 'id'>): DatabaseDocument {
  const databaseDoc: DatabaseDocument = {
    ...doc,
    owner: owner.uid,
    content: JSON.stringify(content),
  }

  return databaseDoc
}

const client = new Client({
  host: 'localhost',
  user: 'postgres',
  password: process.env.PGPASSWORD,
  port: 5432,
  database: 'realtimeDocumentEditor',
})

export async function initDatabase() {
  await client.connect()
}

async function queryDatabase(query: string, data: any[]): Promise<QueryResult<any>> {
  return new Promise((resolve, reject) => {
    client.query(query, data, (err, res) => {
      if (err) {
        console.error(err)
        return reject(err.message)
      }

      resolve(res)
    })
  })
}

export async function selectDocument(docId: string) {
  const query = `
    SELECT id, title, created_at, owner, modified, content
    FROM public.document 
    WHERE id = $1
  `

  const res = await queryDatabase(query, [docId])
  console.log(res.rows[0])
  return await toDocument(res.rows[0])
}

export async function selectDocuments(owner: string) {
  const res = await queryDatabase(
    'SELECT id, title, modified, created_at FROM document WHERE owner = $1',
    [owner],
  )
  return res.rows.map(toDocumentPreview)
}

export async function selectShared(userId: string) {
  const query = `
        SELECT id, title, created_at, modified FROM public.collaborator
        INNER JOIN public.document ON document_id=id
        WHERE user_id = $1
    `

  const res = await queryDatabase(query, [userId])
  return res.rows.map(toDocumentPreview)
}

export async function insertDocument(document: Omit<Document, 'id'>) {
  const databaseDocument = toDatabaseDocument(document)
  const values = Object.keys(databaseDocument)
    .map((_, i) => `$${i + 1}`)
    .join(', ')

  const res = await queryDatabase(
    `INSERT INTO document(${Object.keys(databaseDocument).join(
      ', ',
    )}) VALUES(${values}) RETURNING id`,
    Object.values(databaseDocument),
  )

  return res.rows[0].id
}

export async function dropDocument(owner: string, id: string) {
  const res = await queryDatabase('DELETE FROM document WHERE owner = $1 AND id = $2', [
    owner,
    id,
  ])
  return await toDocument(res.rows[0])
}

export async function selectCollaborators(document: Document) {
  const res = await queryDatabase(
    'SELECT user_id FROM public.collaborator WHERE document_id=$1',
    [document.id],
  )

  return await toCollaborators(res.rows)
}
export async function insertCollaborator(document: Document, userId: string) {
  await queryDatabase('INSERT INTO collaborator(document_id, user_id) VALUES($1, $2)', [
    document.id,
    userId,
  ])
}

export async function dropCollaborator(document: Document, userId: string) {
  await queryDatabase('DELETE FROM collaborator WHERE document_id=$1 AND user_id=$2', [
    document.id,
    userId,
  ])
}
