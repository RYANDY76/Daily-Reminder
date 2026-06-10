import type { SessionType, TaskPriority } from '../types'

export interface TaskTemplate {
  id: string
  profileId: string
  name: string
  title: string
  time: string
  session: SessionType
  notes: string
  color: string
  priority: TaskPriority
  tags: string[]
  createdAt: number
}

const TEMPLATES_KEY = 'daily_reminder_templates'

export function getTemplates(profileId: string): TaskTemplate[] {
  const all = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]') as TaskTemplate[]
  return all.filter(t => t.profileId === profileId)
}

export function saveTemplate(template: TaskTemplate): void {
  const all = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]') as TaskTemplate[]
  const idx = all.findIndex(t => t.id === template.id)
  if (idx >= 0) all[idx] = template
  else all.push(template)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all))
}

export function deleteTemplate(id: string): void {
  const all = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]') as TaskTemplate[]
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all.filter(t => t.id !== id)))
}
