import { create } from 'zustand'

export type ViewType = 
  | 'dashboard' 
  | 'tasks' 
  | 'resources' 
  | 'knowledge-graph' 
  | 'calendar' 
  | 'subject-health' 
  | 'settings' 
  | 'games'
  | 'class-path'
  | 'peer-study'

export type ResourceFilterType = 'all' | 'notes' | 'links' | 'videos' | 'pdf' | 'favorites'
export type HealthStatus = 'red' | 'yellow' | 'green'
export type ThemeMode = 'light' | 'dark'

export interface StudyPeer {
  id: string
  name: string
  avatar: string
  status: 'studying' | 'available' | 'away'
  topic: string
  timeOnline: number
}

export interface StudyRoom {
  id: string
  name: string
  topic: string
  peers: StudyPeer[]
  pomodoroActive: boolean
  focusTime: number
  breakTime: number
}

interface CalendarNote {
  id: string
  date: string
  content: string
  type: 'sticky' | 'photo'
  photoUrl?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Node {
  id: string
  label: string
  completed: boolean
  resourceIds: string[]
  x: number
  y: number
  order: number
}

export interface ClassPath {
  id: string
  subjectId: string
  nodes: Node[]
}

interface WorkflowHealth {
  subjectId: string
  percentage: number
  status: HealthStatus
}

interface DashboardState {
  // View navigation
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  
  // Theme
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  
  // Blackout Mode
  isBlackoutMode: boolean
  toggleBlackoutMode: () => void
  blackoutNotes: string
  setBlackoutNotes: (notes: string) => void
  
  // Chat
  isChatOpen: boolean
  toggleChat: () => void
  chatMessages: ChatMessage[]
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChat: () => void
  
  // Upload Modal
  isUploadOpen: boolean
  openUpload: () => void
  closeUpload: () => void
  
  // Focus mode
  isDeepFocusMode: boolean
  toggleDeepFocusMode: () => void
  
  // UI state
  isSidebarCollapsed: boolean
  isCommandPaletteOpen: boolean
  isResourceDrawerOpen: boolean
  selectedResourceId: string | null
  
  // Calendar notes
  calendarNotes: CalendarNote[]
  addCalendarNote: (note: Omit<CalendarNote, 'id'>) => void
  removeCalendarNote: (id: string) => void
  
  // Class Path state
  classPaths: ClassPath[]
  activeClassId: string | null
  selectedNodeId: string | null
  resourceFilter: ResourceFilterType
  isNodeCreationOpen: boolean
  isLectureModalOpen: boolean
  lectureModalNodeId: string | null
  workflowHealth: WorkflowHealth[]
  
  // Class Path actions
  addNode: (classPathId: string, label: string) => void
  updateNode: (classPathId: string, nodeId: string, updates: Partial<Node>) => void
  deleteNode: (classPathId: string, nodeId: string) => void
  setActiveClass: (classPathId: string) => void
  setSelectedNode: (nodeId: string | null) => void
  setResourceFilter: (filter: ResourceFilterType) => void
  toggleNodeCreation: () => void
  openLectureModal: (nodeId: string) => void
  closeLectureModal: () => void
  calculateWorkflowHealth: (subjectId: string) => HealthStatus
  
  // Peer Study Circle
  isPeerStudyOpen: boolean
  togglePeerStudy: () => void
  studyRooms: StudyRoom[]
  activeStudyRoomId: string | null
  joinStudyRoom: (roomId: string) => void
  leaveStudyRoom: () => void
  startPomodoro: (roomId: string, focusTime: number, breakTime: number) => void
  stopPomodoro: (roomId: string) => void
  onlinePeers: StudyPeer[]
  
  // Actions
  toggleSidebar: () => void
  toggleCommandPalette: () => void
  openResourceDrawer: (id: string) => void
  closeResourceDrawer: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // View navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  
  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  
  // Blackout Mode
  isBlackoutMode: false,
  toggleBlackoutMode: () => set((state) => ({ isBlackoutMode: !state.isBlackoutMode })),
  blackoutNotes: '',
  setBlackoutNotes: (notes) => set({ blackoutNotes: notes }),
  
  // Chat
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, { 
      ...message, 
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }]
  })),
  clearChat: () => set({ chatMessages: [] }),
  
  // Upload Modal
  isUploadOpen: false,
  openUpload: () => set({ isUploadOpen: true }),
  closeUpload: () => set({ isUploadOpen: false }),
  
  // Focus mode
  isDeepFocusMode: false,
  toggleDeepFocusMode: () => set((state) => ({ isDeepFocusMode: !state.isDeepFocusMode })),
  
  // UI state
  isSidebarCollapsed: true, // Start collapsed for cockpit feel
  isCommandPaletteOpen: false,
  isResourceDrawerOpen: false,
  selectedResourceId: null,
  
  // Calendar notes
  calendarNotes: [],
  addCalendarNote: (note) => set((state) => ({
    calendarNotes: [...state.calendarNotes, { ...note, id: crypto.randomUUID() }]
  })),
  removeCalendarNote: (id) => set((state) => ({
    calendarNotes: state.calendarNotes.filter(n => n.id !== id)
  })),
  
  // Class Path state
  classPaths: [],
  activeClassId: null,
  selectedNodeId: null,
  resourceFilter: 'all',
  isNodeCreationOpen: false,
  isLectureModalOpen: false,
  lectureModalNodeId: null,
  workflowHealth: [],
  
  // Class Path actions
  addNode: (classPathId, label) => set((state) => ({
    classPaths: state.classPaths.map(cp => {
      if (cp.id === classPathId) {
        const newNode: Node = {
          id: crypto.randomUUID(),
          label,
          completed: false,
          resourceIds: [],
          x: 0,
          y: 0,
          order: cp.nodes.length
        }
        return { ...cp, nodes: [...cp.nodes, newNode] }
      }
      return cp
    })
  })),
  
  updateNode: (classPathId, nodeId, updates) => set((state) => ({
    classPaths: state.classPaths.map(cp => {
      if (cp.id === classPathId) {
        return {
          ...cp,
          nodes: cp.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n)
        }
      }
      return cp
    })
  })),
  
  deleteNode: (classPathId, nodeId) => set((state) => ({
    classPaths: state.classPaths.map(cp => {
      if (cp.id === classPathId) {
        return {
          ...cp,
          nodes: cp.nodes.filter(n => n.id !== nodeId)
        }
      }
      return cp
    })
  })),
  
  setActiveClass: (classPathId) => set({ activeClassId: classPathId }),
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setResourceFilter: (filter) => set({ resourceFilter: filter }),
  toggleNodeCreation: () => set((state) => ({ isNodeCreationOpen: !state.isNodeCreationOpen })),
  
  openLectureModal: (nodeId) => set({ 
    isLectureModalOpen: true, 
    lectureModalNodeId: nodeId 
  }),
  
  closeLectureModal: () => set({ 
    isLectureModalOpen: false, 
    lectureModalNodeId: null 
  }),
  
  calculateWorkflowHealth: (subjectId) => {
    const state = get()
    const classPath = state.classPaths.find(cp => cp.subjectId === subjectId)
    if (!classPath || classPath.nodes.length === 0) return 'green'
    
    const completedCount = classPath.nodes.filter(n => n.completed).length
    const percentage = (completedCount / classPath.nodes.length) * 100
    
    if (percentage >= 71) return 'green'
    if (percentage >= 31) return 'yellow'
    return 'red'
  },
  
  // Peer Study Circle
  isPeerStudyOpen: false,
  togglePeerStudy: () => set((state) => ({ isPeerStudyOpen: !state.isPeerStudyOpen })),
  studyRooms: [
    {
      id: 'room-1',
      name: 'DSA Bootcamp',
      topic: 'Binary Trees & Recursion',
      peers: [
        { id: 'p1', name: 'Alex', avatar: 'AK', status: 'studying', topic: 'BST Deletion', timeOnline: 45 },
        { id: 'p2', name: 'Jordan', avatar: 'JD', status: 'studying', topic: 'Tree Traversal', timeOnline: 30 }
      ],
      pomodoroActive: true,
      focusTime: 25,
      breakTime: 5
    },
    {
      id: 'room-2',
      name: 'DBMS Study Group',
      topic: 'Normalization & SQL',
      peers: [
        { id: 'p3', name: 'Sam', avatar: 'SM', status: 'available', topic: 'Joins & Subqueries', timeOnline: 20 }
      ],
      pomodoroActive: false,
      focusTime: 25,
      breakTime: 5
    }
  ],
  activeStudyRoomId: null,
  joinStudyRoom: (roomId) => set({ activeStudyRoomId: roomId }),
  leaveStudyRoom: () => set({ activeStudyRoomId: null }),
  startPomodoro: (roomId, focusTime, breakTime) => set((state) => ({
    studyRooms: state.studyRooms.map(room =>
      room.id === roomId ? { ...room, pomodoroActive: true, focusTime, breakTime } : room
    )
  })),
  stopPomodoro: (roomId) => set((state) => ({
    studyRooms: state.studyRooms.map(room =>
      room.id === roomId ? { ...room, pomodoroActive: false } : room
    )
  })),
  onlinePeers: [
    { id: 'p1', name: 'Alex', avatar: 'AK', status: 'studying', topic: 'BST Deletion', timeOnline: 45 },
    { id: 'p2', name: 'Jordan', avatar: 'JD', status: 'studying', topic: 'Tree Traversal', timeOnline: 30 },
    { id: 'p3', name: 'Sam', avatar: 'SM', status: 'available', topic: 'Joins & Subqueries', timeOnline: 20 },
    { id: 'p4', name: 'Casey', avatar: 'CY', status: 'away', topic: 'Math', timeOnline: 120 },
  ],
  
  // Actions
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  openResourceDrawer: (id) => set({ isResourceDrawerOpen: true, selectedResourceId: id }),
  closeResourceDrawer: () => set({ isResourceDrawerOpen: false, selectedResourceId: null }),
}))
