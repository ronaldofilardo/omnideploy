import { useState, useEffect, useCallback } from 'react'
import {
  validateDate,
  validateStartTime,
  validateEndTime,
  ValidationResult,
} from '@/lib/validators/eventValidators'
import { EventType } from '@prisma/client'

// Tipos locais para o formulário
interface Professional {
  id: string
  name: string
  specialty: string
}

interface Event {
  id: string
  professionalId: string
  date: string
  startTime: string
  endTime: string
}

interface UseEventFormProps {
  professionals: Professional[]
  onFormSubmitSuccess: () => void
}

interface FormState {
  eventType: EventType | ''
  selectedProfessional: string
  date: string
  startTime: string
  endTime: string
  observation: string
}

interface FormErrors {
  eventType?: string
  selectedProfessional?: string
  date?: string
  startTime?: string
  endTime?: string
  overlap?: string
}

const INITIAL_STATE: FormState = {
  eventType: '',
  selectedProfessional: '',
  date: '',
  startTime: '',
  endTime: '',
  observation: '',
}

export function useEventForm({
  professionals,
  onFormSubmitSuccess,
}: UseEventFormProps) {
  const [state, setState] = useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<FormErrors>({})
  const [events, setEvents] = useState<Event[]>([])

  // Busca eventos existentes para validação de sobreposição
  const fetchEvents = useCallback(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const validateField = useCallback(
    (name: keyof FormState, value: string) => {
      let validation: ValidationResult = { isValid: true }
      if (name === 'date') {
        validation = validateDate(value)
      } else if (name === 'startTime') {
        validation = validateStartTime(value)
      } else if (name === 'endTime') {
        validation = validateEndTime(value, state.startTime)
      }
      return validation
    },
    [state.date, state.startTime]
  )

  const checkOverlap = useCallback(
    (
      date: string,
      startTime: string,
      endTime: string,
      professionalId: string
    ) => {
      if (!date || !startTime || !endTime || !professionalId) return null

      // Usar strings diretamente para evitar problemas de timezone
      const newEventStartStr = `${date}T${startTime}:00`
      const newEventEndStr = `${date}T${endTime}:00`

      const overlappingEvent = events.find((e) => {
        if (e.professionalId !== professionalId) return false
        const eventDate = e.date.split('T')[0]
        if (eventDate !== date) return false

        const existingStartStr = `${eventDate}T${e.startTime}:00`
        const existingEndStr = `${eventDate}T${e.endTime}:00`

        // Comparar strings diretamente para evitar timezone issues
        return (
          newEventStartStr < existingEndStr && newEventEndStr > existingStartStr
        )
      })

      if (overlappingEvent) {
        return `Conflito: Este profissional já possui um evento das ${overlappingEvent.startTime} às ${overlappingEvent.endTime}.`
      }
      return null
    },
    [events]
  )

  const handleFieldChange = <T extends keyof FormState>(
    field: T,
    value: FormState[T]
  ) => {
    setState((prev) => ({ ...prev, [field]: value }))

    // Limpa o erro do campo ao ser modificado
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field as keyof FormErrors]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: FormErrors = {}

    // Validações individuais
    if (!state.eventType) newErrors.eventType = 'Selecione um tipo de evento.'
    if (!state.selectedProfessional)
      newErrors.selectedProfessional = 'Selecione um profissional.'

    const dateValidation = validateDate(state.date)
    if (!dateValidation.isValid) newErrors.date = dateValidation.error

    const startTimeValidation = validateStartTime(state.startTime)
    if (!startTimeValidation.isValid)
      newErrors.startTime = startTimeValidation.error

    const endTimeValidation = validateEndTime(state.endTime, state.startTime)
    if (!endTimeValidation.isValid) newErrors.endTime = endTimeValidation.error

    // Validação de sobreposição
    if (
      dateValidation.isValid &&
      startTimeValidation.isValid &&
      endTimeValidation.isValid &&
      state.selectedProfessional
    ) {
      const overlapMsg = checkOverlap(
        state.date,
        state.startTime,
        state.endTime,
        state.selectedProfessional
      )
      if (overlapMsg) newErrors.overlap = overlapMsg
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    // Submissão para a API
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.eventType, // O título é derivado do tipo
          description: state.observation,
          date: state.date, // Já vem como string YYYY-MM-DD do input type="date"
          type: state.eventType,
          startTime: state.startTime,
          endTime: state.endTime,
          professionalId: state.selectedProfessional,
          files: [], // Gerenciamento de arquivos é feito em outro modal
        }),
      })

      if (!response.ok) {
        let errorMsg = 'Falha na comunicação com o servidor. Tente novamente.';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch {}
        setErrors({ overlap: errorMsg });
        return;
      }

      // Sucesso
      setState(INITIAL_STATE)
      onFormSubmitSuccess()
    } catch (error) {
      setErrors({
        overlap: 'Falha na comunicação com o servidor. Tente novamente.',
      })
    }
  }

  return {
    formState: state,
    errors,
    setErrors,
    professionalOptions: professionals,
    handleFieldChange,
    handleSubmit,
    setFormState: setState,
    refreshEvents: fetchEvents,
  }
}
