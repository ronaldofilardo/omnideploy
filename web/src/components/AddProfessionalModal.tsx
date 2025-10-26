import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { AddSpecialtyModal } from './AddSpecialtyModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface AddProfessionalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (professional: {
    name: string
    specialty: string
    address: string
    contact: string
  }) => void
}

export function AddProfessionalModal({
  open,
  onOpenChange,
  onSave,
}: AddProfessionalModalProps) {
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [address, setAddress] = useState('')
  const [contact, setContact] = useState('')
  const [isAddSpecialtyModalOpen, setIsAddSpecialtyModalOpen] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  // Lista de especialidades do banco de dados
  const [specialties, setSpecialties] = useState<string[]>([])

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch('/api/professionals?type=specialties')
        if (response.ok) {
          const data = await response.json()
          setSpecialties(data)
        }
      } catch (error) {
        console.error('Erro ao buscar especialidades:', error)
      }
    }
    fetchSpecialties()
  }, [])

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Por favor, preencha o nome do profissional.')
      return
    }
    if (!specialty) {
      alert('Por favor, selecione uma especialidade.')
      return
    }
    onSave({
      name: name.trim(),
      specialty: specialty,
      address: address.trim(),
      contact: contact.trim(),
    })
    // Reset form
    setName('')
    setSpecialty('')
    setAddress('')
    setContact('')
    onOpenChange(false)
  }

  const handleAddSpecialty = (newSpecialty: string) => {
    setSpecialties([...specialties, newSpecialty])
    setSpecialty(newSpecialty)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowConfirmClose(true)
    } else {
      // Limpar estado quando abrir
      setName('')
      setSpecialty('')
      setAddress('')
      setContact('')
      onOpenChange(newOpen)
    }
  }

  const confirmClose = () => {
    setShowConfirmClose(false)
    // Limpar estado do formulário
    setName('')
    setSpecialty('')
    setAddress('')
    setContact('')
    onOpenChange(false)
  }

  const cancelClose = () => {
    setShowConfirmClose(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[480px] p-0 gap-0 bg-white border-0 shadow-xl">
          <VisuallyHidden>
            <DialogTitle>Adicionar Novo Profissional</DialogTitle>
          </VisuallyHidden>
          {/* Header */}
          <div className="pt-8 px-10">
            <h2 className="text-[#1F2937] text-center m-0">
              Adicionar Novo Profissional
            </h2>
          </div>
          {/* Form */}
          <div className="px-10 pt-6 pb-8">
            <div className="flex flex-col gap-5">
              {/* Nome */}
              <div className="space-y-2">
                <label className="text-[#111827] text-sm block">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[#374151] placeholder:text-[#9CA3AF] focus:ring-0 focus:ring-offset-0"
                />
              </div>
              {/* Especialidade */}
              <div className="space-y-2">
                <label className="text-[#111827] text-sm block">
                  Especialidade
                </label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="w-full h-10 bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[#374151] focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Selecione uma especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((spec, idx) => (
                      <SelectItem
                        key={spec + '-' + idx}
                        value={spec}
                        className="hover:bg-[#F3F4F6] focus:bg-[#E5E7EB] px-4 py-2 text-[#374151]"
                      >
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#10B981] text-xs px-0"
                  onClick={() => setIsAddSpecialtyModalOpen(true)}
                >
                  + Adicionar nova especialidade
                </Button>
              </div>
              {/* Endereço */}
              <div className="space-y-2">
                <label className="text-[#111827] text-sm block">Endereço</label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full min-h-20 bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[#374151] placeholder:text-[#9CA3AF] focus:ring-0 focus:ring-offset-0"
                  placeholder="Digite o endereço..."
                  maxLength={500}
                />
              </div>
              {/* Contato */}
              <div className="space-y-2">
                <label className="text-[#111827] text-sm block">Contato</label>
                <Input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full h-10 bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[#374151] placeholder:text-[#9CA3AF] focus:ring-0 focus:ring-offset-0"
                  placeholder="Digite o contato..."
                  maxLength={100}
                />
              </div>
              <Button
                className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-6 rounded-lg mt-4"
                onClick={handleSubmit}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal para adicionar especialidade */}
      <AddSpecialtyModal
        open={isAddSpecialtyModalOpen}
        onOpenChange={setIsAddSpecialtyModalOpen}
        onSave={handleAddSpecialty}
      />
      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja realmente sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
