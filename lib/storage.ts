import { Draft } from './types'

const STORAGE_KEY = 'ra_lab_drafts'

export function loadDrafts(): Draft[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveDraft(draft: Draft): Draft[] {
  const drafts = loadDrafts()
  const index = drafts.findIndex(d => d.id === draft.id)
  
  if (index >= 0) {
    drafts[index] = draft
  } else {
    drafts.push(draft)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  return drafts
}

export function deleteDraft(id: string): Draft[] {
  const drafts = loadDrafts().filter(d => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  return drafts
}