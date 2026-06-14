export interface FamilyMember {
  id: string
  name: string
  role: 'parent' | 'child'
  avatar: string
  createdAt: number
}

export interface FamilyLink {
  id: string
  parentId: string
  childId: string
  linkedAt: number
  status: 'active' | 'inactive'
}

export interface FamilyActivity {
  id: string
  childId: string
  parentId: string
  type: 'task_done' | 'streak' | 'badge' | 'level_up'
  message: string
  timestamp: number
}
