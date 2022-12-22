import { AddRounded, EditRounded } from '@mui/icons-material'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../../api/api'
import { Document, DocumentPreview } from '../../util/Types'
import ChangeName from '../Editor/ChangeName'
import DeleteDocument from '../Editor/DeleteDocument'
import CreateDocument from './CreateDocument'
import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'

interface CreateDocumentEvent extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    title: HTMLInputElement
  }
}

export default function Home() {
  const navigate = useNavigate()
  const documentsQuery = useQuery<DocumentPreview[], AxiosError>(
    ['document', 'all'],
    api.getDocuments,
  )
  const sharedQuery = useQuery<DocumentPreview[], AxiosError>(
    ['document', 'shared'],
    api.getShared,
  )

  const createButton = useRef(null)

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
  const [showChangeNameModal, setShowChangeNameModal] = useState<boolean>(false)
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState<boolean>(false)

  const createDocument = (e: CreateDocumentEvent) => {
    e.preventDefault()
    api
      .createDocument({ title: e.target.title.value })
      .then((res) => navigate('/document/' + res.data.documentId))
  }

  const openDocument = (id: string | number) => {
    navigate('/document/' + id)
  }

  return (
    <Box>
      <ChangeName
        open={showChangeNameModal}
        onClose={() => setShowChangeNameModal(false)}
      />
      <DeleteDocument
        open={showDeleteDocumentModal}
        onClose={() => setShowDeleteDocumentModal(false)}
      />
      <Button
        startIcon={<AddRounded />}
        size="large"
        variant="contained"
        ref={createButton}
        onClick={() => setIsCreateOpen(true)}
        sx={{ mb: 5 }}
      >
        Create document
      </Button>
      <CreateDocument
        anchorEl={createButton.current}
        id="create-document-menu"
        open={isCreateOpen}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        onClose={() => setIsCreateOpen(false)}
        onCreate={createDocument}
      />
      <Typography variant="h1">Your documents</Typography>
      {documentsQuery.isLoading ? (
        <List disablePadding>
          {[...new Array(3)].map(() => (
            <ListItem disablePadding>
              <ListItemText primary={<Skeleton />} secondary={<Skeleton />} />
            </ListItem>
          ))}
        </List>
      ) : documentsQuery.isSuccess ? (
        <List disablePadding>
          {documentsQuery.data.map((doc) => (
            <>
              <ListItem
                key={doc.id}
                secondaryAction={
                  <>
                    <Tooltip title="Rename">
                      <IconButton
                        edge="end"
                        sx={{ mr: '4px' }}
                        onClick={() => setShowChangeNameModal(true)}
                      >
                        <EditRounded />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        onClick={() => setShowDeleteDocumentModal(true)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                }
                disablePadding
              >
                <ListItemButton onClick={() => openDocument(doc.id)}>
                  <ListItemText
                    primary={doc.title}
                    secondary={new Date().toLocaleDateString('sv-SE')}
                  />
                </ListItemButton>
              </ListItem>
            </>
          ))}
        </List>
      ) : (
        documentsQuery.isError && (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {documentsQuery.error.message}
          </Alert>
        )
      )}
      <Typography variant="h2">Shared documents</Typography>
      {sharedQuery.isLoading ? (
        <List disablePadding>
          {[...new Array(3)].map(() => (
            <ListItem disablePadding>
              <ListItemText primary={<Skeleton />} secondary={<Skeleton />} />
            </ListItem>
          ))}
        </List>
      ) : sharedQuery.isSuccess ? (
        <List disablePadding>
          {sharedQuery.data.map((doc) => (
            <>
              <ListItem
                key={doc.id}
                secondaryAction={
                  <>
                    <Tooltip title="Rename">
                      <IconButton
                        edge="end"
                        sx={{ mr: '4px' }}
                        onClick={() => setShowChangeNameModal(true)}
                      >
                        <EditRounded />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        onClick={() => setShowDeleteDocumentModal(true)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                }
                disablePadding
              >
                <ListItemButton onClick={() => openDocument(doc.id)}>
                  <ListItemText
                    primary={doc.title}
                    secondary={new Date().toLocaleDateString('sv-SE')}
                  />
                </ListItemButton>
              </ListItem>
            </>
          ))}
        </List>
      ) : (
        sharedQuery.isError && (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {sharedQuery.error.message}
          </Alert>
        )
      )}
    </Box>
  )
}
