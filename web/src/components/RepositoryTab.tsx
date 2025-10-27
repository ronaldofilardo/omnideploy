'use client'
import { useState, useEffect, useMemo } from 'react'
import { Eye, Trash2, UploadCloud, Info, Search } from 'lucide-react'
import { Input } from './ui/input'
import { format, toZonedTime } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale/pt-BR'

// Tipos de dados
interface FileInfo {
  slot: string
  name: string
  url: string
  uploadDate?: string
  expiryDate?: string
}
interface Professional {
  id: string
  name: string
  specialty: string
}
interface EventWithFiles {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  files: FileInfo[]
  professional: Professional
}

// Componente para um único slot de arquivo
function FileSlot({
  label,
  file,
  onUpload,
  onView,
  onDelete,
  formatFileDate,
}: {
  label: string
  file?: FileInfo
  onUpload: () => void
  onView: () => void
  onDelete: () => void
  formatFileDate: (dateString: string) => string
}) {
  const hasFile = !!file

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${hasFile ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span
          className={`font-medium ${hasFile ? 'text-emerald-800' : 'text-gray-500'}`}
        >
          {label}
        </span>
        {hasFile && (
          <div className="flex flex-col">
            <span className="text-sm text-emerald-700 truncate">
              ({file.name})
            </span>
            {file.uploadDate && (
              <span className="text-xs text-emerald-600">
                Upload: {formatFileDate(file.uploadDate)}
              </span>
            )}
            {file.expiryDate && (
              <span className="text-xs text-emerald-600">
                Validade: {formatFileDate(file.expiryDate)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {hasFile ? (
          <>
            <button
              onClick={onView}
              className="text-gray-500 hover:text-blue-600"
              title="Visualizar"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={onDelete}
              className="text-gray-500 hover:text-red-600"
              title="Deletar"
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onUpload}
            className="text-gray-400 hover:text-blue-600"
            title="Upload"
          >
            <UploadCloud size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export function RepositoryTab() {
  const [events, setEvents] = useState<EventWithFiles[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch('/api/repository')
        if (!response.ok) throw new Error('Falha ao buscar dados')
        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error('Erro ao carregar repositório:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return events
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        event.professional.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        event.files.some((file) =>
          file.name.toLowerCase().includes(lowerCaseSearchTerm)
        )
    )
  }, [events, searchTerm])

  const groupedEvents = useMemo(() => {
    const grouped = filteredEvents.reduce(
      (acc, event) => {
        const dateKey = event.date.split('T')[0]
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(event)
        return acc
      },
      {} as Record<string, EventWithFiles[]>
    )
    return Object.entries(grouped)
  }, [filteredEvents])

  const fileSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    let total = 0
    events.forEach((event) => {
      event.files.forEach((file) => {
        total++
        const type = file.slot.charAt(0).toUpperCase() + file.slot.slice(1)
        counts[type] = (counts[type] || 0) + 1
      })
    })
    const summaryString = Object.entries(counts)
      .map(([type, count]) => `${count} ${type}(s)`)
      .join(' • ')
    return `Total: ${total} documento(s) (${summaryString})`
  }, [events])

  const formatDate = (dateString: string) => {
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = toZonedTime(new Date(dateString + 'T12:00:00'), userTZ)
    return format(date, 'dd/MM/yyyy - EEEE', { locale: ptBR })
  }

  const formatFileDate = (dateString: string) => {
    // Para datas de arquivos, manter como string YYYY-MM-DD e exibir no timezone local
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = toZonedTime(new Date(dateString + 'T12:00:00'), userTZ)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Repositório de Arquivos
          </h1>
          <span className="text-gray-500">
            {format(new Date(), 'dd/MM/yyyy - EEEE', { locale: ptBR })}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-grow bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-r-lg flex items-center gap-3">
            <Info size={20} className="text-blue-500" />
            <p className="font-medium">{fileSummary}</p>
          </div>
          <div className="relative w-72">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Buscar por evento, profissional ou arquivo..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main>
        {loading ? (
          <p className="text-center text-gray-500 mt-10">
            Carregando repositório...
          </p>
        ) : groupedEvents.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            {searchTerm
              ? 'Nenhum resultado encontrado para sua busca.'
              : 'Nenhum arquivo encontrado no seu repositório.'}
          </p>
        ) : (
          <div className="space-y-8">
            {groupedEvents.map(([date, dayEvents]) => (
              <div key={date}>
                <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">
                  {formatDate(date)}
                </h2>
                <div className="space-y-6">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
                    >
                      <h3 className="font-bold text-lg text-gray-800 mb-4">
                        {event.title} - {event.professional.name} -{' '}
                        {event.startTime} - {event.endTime}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'request',
                          'authorization',
                          'certificate',
                          'result',
                          'prescription',
                          'invoice',
                        ].map((slotType) => {
                          const file = event.files.find(
                            (f) => f.slot === slotType
                          )
                          const labels: Record<string, string> = {
                            request: 'Solicitação',
                            authorization: 'Autorização',
                            certificate: 'Atestado',
                            result: 'Laudo/Resultado',
                            prescription: 'Prescrição',
                            invoice: 'Nota Fiscal',
                          }
                          return (
                            <FileSlot
                              key={slotType}
                              label={labels[slotType]}
                              file={file}
                              onView={() =>
                                file && window.open(file.url, '_blank')
                              }
                              onDelete={() =>
                                alert(
                                  `Funcionalidade de deletar o arquivo '${file?.name}' a ser implementada.`
                                )
                              }
                              onUpload={() =>
                                alert(
                                  `Funcionalidade de upload para o slot '${labels[slotType]}' a ser implementada.`
                                )
                              }
                              formatFileDate={formatFileDate}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
