import axios from 'axios'
import { User } from 'firebase/auth'

import { Document, DocumentPreview } from '../util/Types'
import { auth } from './firebase'

const API_URL = 'http://localhost:8888'

interface SignUpRequest {
  email: string
  username: string
  password: string
}

interface UpdateAccountRequest {
  username: string
  profilePicture?: string
}

interface SignUpResponse {
  signInToken: string
}

interface UpdateUserResponse {
  username: string
  profilePicture?: string
}

interface CreateDocumentResponse {
  documentId: string | number
}

interface GetUserRequest {
  uid?: string
  phoneNumber?: string
  email?: string
}

async function getAuthedHeaders() {
  return { headers: { Authorization: await auth.currentUser?.getIdToken(false) } }
}

const api = {
  signUp: ({ email, username, password }: SignUpRequest) =>
    axios.post<SignUpResponse>(`${API_URL}/user`, {
      email,
      username,
      password,
    }),

  updateAccount: async ({ username, profilePicture }: UpdateAccountRequest) => {
    return axios.patch<UpdateUserResponse>(
      `${API_URL}/user`,
      {
        username,
        profilePicture,
      },
      { ...(await getAuthedHeaders()) },
    )
  },
  createDocument: async ({ title }: Partial<Document>) => {
    return axios.post<CreateDocumentResponse>(
      `${API_URL}/document`,
      {
        title,
      },
      { ...(await getAuthedHeaders()) },
    )
  },
  getDocument: async (id: string | number) => {
    return axios
      .get<Document>(`${API_URL}/document/${id}`, {
        ...(await getAuthedHeaders()),
      })
      .then((res) => res.data)
  },
  getUser: async ({ uid, phoneNumber, email }: GetUserRequest) => {
    return axios.get<User | null>(`${API_URL}/user`, {
      params: { uid, phoneNumber, email },
      ...(await getAuthedHeaders()),
    })
  },
  getDocuments: async () => {
    return axios
      .get<DocumentPreview[]>(`${API_URL}/document/all`, {
        ...(await getAuthedHeaders()),
      })
      .then((res) => res.data)
  },
  getShared: async () => {
    return axios
      .get<DocumentPreview[]>(`${API_URL}/document/shared`, {
        ...(await getAuthedHeaders()),
      })
      .then((res) => res.data)
  },
  deleteDocument: async (id: string | number) => {
    return (
      axios.delete(`${API_URL}/document/${id}`),
      {
        ...(await getAuthedHeaders()),
      }
    )
  },
  getCollaborators: async (documentId: string | number) =>
    axios
      .get<User[]>(`${API_URL}/document/${documentId}/collaborator`, {
        ...(await getAuthedHeaders()),
      })
      .then(({ data }) => data),
  addCollaborator: async (userId: string, documentId: string | number) =>
    axios.post(
      `${API_URL}/document/${documentId}/collaborator`,
      { userId },
      {
        ...(await getAuthedHeaders()),
      },
    ),
  removeCollaborator: async (userId: string, documentId: string | number) =>
    axios.delete(`${API_URL}/document/${documentId}/collaborator/${userId}`, {
      ...(await getAuthedHeaders()),
    }),
}

export default api
