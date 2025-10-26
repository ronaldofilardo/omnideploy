import { Button } from './ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface ProfessionalCardProps {
  id: string
  name: string
  specialty: string
  address?: string
  contact?: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function ProfessionalCard({
  id,
  name,
  specialty,
  address,
  contact,
  onEdit,
  onDelete,
}: ProfessionalCardProps) {
  const isActive = specialty !== 'A ser definido'
  console.log('[ProfessionalCard] Specialty:', specialty, 'Name:', name)

  return (
    <div className="w-[360px] h-[220px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
      {/* Card Content */}
      <div className="p-6 h-[164px] flex flex-col">
        <h3 className="text-gray-900 mb-2 m-0">{name}</h3>
        <p
          className={`${
            isActive ? 'text-[#10B981]' : 'text-[#9CA3AF]'
          } mb-3 m-0`}
        >
          {specialty}
        </p>
        {address && (
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[#6B7280] text-[14px] leading-relaxed m-0 flex-1">
              {address}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2 text-xs text-[#10B981] border border-[#D1D5DB] rounded hover:bg-[#F3F4F6]"
              onClick={() => navigator.clipboard.writeText(address)}
            >
              Copiar
            </Button>
          </div>
        )}
        {contact && (
          <p className="text-[#374151] text-[14px] leading-relaxed m-0">
            Contato: {contact}
          </p>
        )}
      </div>

      {/* Card Actions */}
      <div className="h-[56px] border-t border-[#E5E7EB] px-6 flex items-center gap-3">
        <Button
          onClick={() => onEdit(id)}
          variant="outline"
          className="h-8 px-4 bg-transparent border border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white rounded-md text-xs transition-colors"
        >
          <Pencil className="w-3 h-3 mr-2" />
          Editar
        </Button>
        <Button
          onClick={() => onDelete(id)}
          variant="outline"
          className="h-8 px-4 bg-transparent border border-[#10B981] text-[#10B981] hover:bg-[#EF4444] hover:border-[#EF4444] hover:text-white rounded-md text-xs transition-colors"
        >
          <Trash2 className="w-3 h-3 mr-2" />
          Excluir
        </Button>
      </div>
    </div>
  )
}
