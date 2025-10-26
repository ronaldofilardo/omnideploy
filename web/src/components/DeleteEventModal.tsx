import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'

interface DeleteEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (deleteFiles: boolean) => void
  eventTitle: string
}

export function DeleteEventModal({
  open,
  onOpenChange,
  onConfirm,
  eventTitle,
}: DeleteEventModalProps) {
  const [deleteFiles, setDeleteFiles] = useState(false)

  const handleConfirm = () => {
    onConfirm(deleteFiles)
    setDeleteFiles(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setDeleteFiles(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[400px] p-0 gap-0 bg-[#F5F5F5] border-0 shadow-lg overflow-hidden"
        aria-describedby="delete-event-description"
      >
        <VisuallyHidden>
          <DialogTitle>Excluir Evento</DialogTitle>
        </VisuallyHidden>
        <DialogDescription id="delete-event-description" className="sr-only">
          Confirmar exclusão do evento
        </DialogDescription>
        <div className="bg-[#E5E7EB] py-4 px-6 text-center">
          <span className="sr-only">
            <DialogTitle id="delete-event-title">Excluir Evento</DialogTitle>
          </span>
          <h2 className="text-[#1F2937] m-0">Excluir Evento</h2>
        </div>
        <div className="bg-white mx-6 my-6 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <p className="text-[#374151] text-center">
              Tem certeza de que deseja excluir o evento "{eventTitle}"?
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="deleteFiles"
                checked={deleteFiles}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  setDeleteFiles(checked === true)
                }
                className="w-4 h-4 border-[#D1D5DB] data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000]"
              />
              <label
                htmlFor="deleteFiles"
                className="text-[#374151] text-sm cursor-pointer"
              >
                Deletar arquivos associados
              </label>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleCancel}
                className="bg-[#808080] hover:bg-[#666666] text-white px-6"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-[#FF0000] hover:bg-[#CC0000] text-white px-6"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
        <div className="text-center pb-4 text-xs text-[#9CA3AF]">
          © 2025 Omni Saúde
        </div>
      </DialogContent>
    </Dialog>
  )
}
