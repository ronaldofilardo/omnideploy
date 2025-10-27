import { useState } from 'react'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { ProfessionalCard } from './ProfessionalCard'
import { AddProfessionalModal } from './AddProfessionalModal'
import { EditProfessionalModal } from './EditProfessionalModal'

interface Professional {
  id: string
  name: string
  specialty: string
  address?: string
  contact?: string
}

interface ProfessionalsTabProps {
  professionals: Professional[]
  setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>
}

export function ProfessionalsTab({
  professionals,
  setProfessionals,
}: ProfessionalsTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null)

  // Especialidades do usuário (filtradas dos profissionais)
  const specialties =
    professionals.length > 0
      ? Array.from(
          new Set(
            professionals
              .map((p) => p.specialty)
              .filter((s) => s && s !== 'A ser definido')
          )
        )
      : []

  const handleEdit = (id: string) => {
    const prof = professionals.find((p) => p.id === id)
    if (prof) {
      setEditingProfessional(prof)
      setIsEditModalOpen(true)
    }
  }

  const handleSaveEdit = async (updated: {
    id: string
    name: string
    specialty: string
    address: string
    contact: string
  }) => {
    try {
      const response = await fetch('/api/professionals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          name: updated.name,
          specialty: updated.specialty,
          address: updated.address || '',
          contact: updated.contact || '',
        }),
      })
      if (!response.ok) throw new Error('Erro ao editar profissional')
      const savedProfessional = await response.json()
      setProfessionals(
        professionals.map((p) =>
          p.id === savedProfessional.id ? savedProfessional : p
        )
      )
    } catch {
      alert('Erro ao editar profissional.')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        const response = await fetch('/api/professionals', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        if (!response.ok) throw new Error('Erro ao excluir profissional')
        setProfessionals(professionals.filter((p) => p.id !== id))
      } catch {
        alert('Erro ao excluir profissional.')
      }
    }
  }

  const handleAddProfessional = async (professional: {
    name: string
    specialty: string
    address: string
    contact: string
  }) => {
    try {
      const response = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(professional),
      })
      if (!response.ok) throw new Error('Erro ao adicionar profissional')
      const savedProfessional = await response.json()
      setProfessionals([...professionals, savedProfessional])
    } catch {
      alert('Erro ao adicionar profissional.')
    }
  }

  return (
    <div className="flex-1 w-full md:w-[1160px] relative">
      {/* Header */}
      <div className="px-4 md:px-12 pt-12 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <h1 className="text-[#111827] text-xl md:text-2xl">Profissionais</h1>

          {/* Add Professional Button */}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-4 md:px-6 rounded-lg flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm md:text-[14px]">Adicionar Profissional</span>
          </Button>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="px-4 md:px-12 pt-6 md:pt-10">
        {professionals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9CA3AF] text-lg mb-4">Nenhum profissional cadastrado</p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-6 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[14px]">Adicionar Primeiro Profissional</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {professionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                id={professional.id}
                name={professional.name}
                specialty={professional.specialty}
                address={professional.address}
                contact={professional.contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Adição */}
      <AddProfessionalModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddProfessional}
      />

      {/* Modal de Edição */}
      {editingProfessional && (
        <EditProfessionalModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          professional={editingProfessional}
          specialties={specialties}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}
