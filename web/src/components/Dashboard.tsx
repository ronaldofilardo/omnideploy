'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Timeline } from './Timeline'
import NewEventModal from './NewEventModal'
import { ProfessionalsTab } from './ProfessionalsTab'
import { RepositoryTab } from './RepositoryTab'
import { CalendarTab } from './CalendarTab'
import { Button } from './ui/button'

interface DashboardProps {
  onLogout: () => void
}

// Definir tipo Professional
interface Professional {
  id: string
  name: string
  specialty: string
  address?: string
  contact?: string
}

// Definir tipo Event
interface Event {
  id: string
  title: string
  description?: string
  date: string
  type: string
  professionalId: string
  startTime?: string
  endTime?: string
  observation?: string
  instructions?: boolean
  status?: 'past' | 'current' | 'future'
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeMenu, setActiveMenu] = useState('timeline')
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Debug: monitorar estado do modal
  useEffect(() => {
    console.log(
      'Dashboard: isNewEventModalOpen changed to',
      isNewEventModalOpen
    )
  }, [isNewEventModalOpen])
  const [events, setEvents] = useState<Event[]>([])

  // Estado único de profissionais
  const [professionals, setProfessionals] = useState<Professional[]>([])

  // Buscar profissionais do backend ao montar
  useEffect(() => {
    fetch('/api/professionals')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProfessionals(data)
      })
  }, [])

  // Polling com retry exponencial otimizado
  const fetchEventsWithRetry = useCallback(async (retryCount = 0) => {
    try {
      console.log('[Dashboard] Fetching events...')
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      console.log('[Dashboard] Events fetched:', data)
      if (Array.isArray(data)) {
        // Só atualiza se os dados realmente mudaram
        setEvents((prevEvents) => {
          if (JSON.stringify(prevEvents) !== JSON.stringify(data)) {
            console.log('[Dashboard] Events updated:', data.length, 'events')
            return data
          }
          console.log('[Dashboard] Events unchanged')
          return prevEvents
        })
      } else {
        console.warn('[Dashboard] Events data is not an array:', data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      if (retryCount < 3) {
        // Reduzido para 3 tentativas
        const delay = Math.min(2000 * Math.pow(2, retryCount), 10000) // Máximo 10s
        setTimeout(() => fetchEventsWithRetry(retryCount + 1), delay)
      }
    }
  }, [])

  // Buscar eventos do backend ao montar
  useEffect(() => {
    fetchEventsWithRetry()
  }, [fetchEventsWithRetry])

  // Polling automático a cada 60 segundos (reduzido para melhorar performance)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEventsWithRetry()
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchEventsWithRetry])

  // Função para atualizar eventos após criar (otimizada)
  const refreshEvents = useCallback(() => {
    fetchEventsWithRetry()
  }, [fetchEventsWithRetry])

  const handleMenuClick = (menu: string) => {
    if (menu === 'logout') {
      onLogout()
    } else {
      setActiveMenu(menu)
      // Fechar sidebar em dispositivos móveis após seleção
      setIsSidebarOpen(false)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Get current date formatted
  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'long',
    }
    const date = new Date()
    const formatted = date.toLocaleDateString('pt-BR', options)
    const [weekday, dateStr] = formatted.split(', ')
    return `${dateStr} - ${weekday}`
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#F8FAFC] to-white overflow-hidden">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={toggleSidebar}
          variant="outline"
          size="sm"
          className="bg-white shadow-md"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 h-screen transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          activeMenu={activeMenu}
          onMenuClick={handleMenuClick}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      {activeMenu === 'timeline' && (
        <div className="flex-1 w-full md:w-[1160px] relative ml-0 md:ml-0">
          {/* Header */}
          <div className="px-4 md:px-12 pt-12 pb-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-[#111827] text-xl md:text-2xl">Minha Timeline</h1>
              {/* New Event Button */}
              <Button
                onClick={() => setIsNewEventModalOpen(true)}
                className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-4 md:px-6 rounded-lg flex items-center gap-2 text-sm md:text-base"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-[14px]">Novo Evento</span>
                <span className="sm:hidden text-[14px]">Novo</span>
              </Button>
            </div>
            {/* Current Date */}
            <p className="text-[#6B7280] text-sm md:text-[16px]">{getCurrentDate()}</p>
          </div>
          {/* Timeline Content Area */}
          <div className="px-4 md:px-12 py-6 overflow-y-auto h-full">
            {(() => {
              console.log('[Dashboard] Rendering timeline, events:', events, 'professionals:', professionals)
              return null
            })()}
            {events && events.length > 0 ? (
              <Timeline
                onUpdate={refreshEvents}
                events={events}
                professionals={professionals}
                onView={(event: Event) => {
                  // Implementar modal ou navegação para visualizar detalhes do evento
                  alert(`Visualizando evento: ${event.title}`)
                }}
                onFiles={(event: Event) => {
                  // Implementar modal ou navegação para gerenciar arquivos do evento
                  alert(`Arquivos do evento: ${event.title}`)
                }}
                onEdit={(event: Event) => {
                  // Implementar modal de edição ou navegação para editar evento
                  alert(`Editando evento: ${event.title}`)
                }}
                onDelete={async (event: Event, deleteFiles: boolean) => {
                  // Chama API para deletar evento (rota correta: body com id e deleteFiles)
                  await fetch('/api/events', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: event.id, deleteFiles }),
                  })
                  // Atualiza eventos do backend
                  await fetchEventsWithRetry()
                  // Forçar atualização do hook useEventForm
                  setTimeout(() => fetchEventsWithRetry(), 100)
                }}
              />
            ) : (
              <div className="text-center text-[#9CA3AF] text-lg mt-12">
                Ainda não existem eventos cadastrados
              </div>
            )}
          </div>
        </div>
      )}
      {/* Professionals Tab */}
      {activeMenu === 'repositorio' && <RepositoryTab />}
      {activeMenu === 'professionals' && (
        <ProfessionalsTab
          professionals={professionals}
          setProfessionals={setProfessionals}
        />
      )}
      {/* Calendar Tab */}
      {activeMenu === 'calendario' && (
        <CalendarTab
          events={events}
          professionals={professionals}
          onBackToTimeline={() => setActiveMenu('timeline')}
        />
      )}
      {/* New Event Modal */}
      <NewEventModal
        open={isNewEventModalOpen}
        onOpenChange={(open) => {
          console.log('Dashboard: NewEventModal onOpenChange called with', open)
          setIsNewEventModalOpen(open)
        }}
        professionals={professionals}
        setProfessionals={setProfessionals}
      />
      {/* Renderizar eventos reais do banco */}
    </div>
  )
}
