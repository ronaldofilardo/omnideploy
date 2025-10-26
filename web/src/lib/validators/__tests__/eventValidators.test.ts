import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  validateDate,
  validateStartTime,
  validateEndTime,
  validateEventDateTime,
  validateFileDate,
  isValidTimeFormat,
  isValidDateFormat,
  parseDate,
} from '../eventValidators'

describe('eventValidators', () => {
  beforeEach(() => {
    // Mock da data atual para testes consistentes
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isValidTimeFormat', () => {
    it('deve validar formato HH:mm correto', () => {
      expect(isValidTimeFormat('10:30')).toBe(true)
      expect(isValidTimeFormat('00:00')).toBe(true)
      expect(isValidTimeFormat('23:59')).toBe(true)
    })

    it('deve rejeitar formatos inválidos', () => {
      expect(isValidTimeFormat('10:3')).toBe(false)
      expect(isValidTimeFormat('1:30')).toBe(false)
      expect(isValidTimeFormat('10:30:00')).toBe(false)
      expect(isValidTimeFormat('25:00')).toBe(false)
      expect(isValidTimeFormat('24:00')).toBe(false)
      expect(isValidTimeFormat('10:60')).toBe(false)
      expect(isValidTimeFormat('abc')).toBe(false)
    })
  })

  describe('isValidDateFormat', () => {
    it('deve validar formato ISO (yyyy-MM-dd)', () => {
      expect(isValidDateFormat('2025-01-15')).toBe(true)
      expect(isValidDateFormat('2025-12-31')).toBe(true)
    })

    it('deve validar formato dd/mm/yyyy', () => {
      expect(isValidDateFormat('15/01/2025')).toBe(true)
      expect(isValidDateFormat('31/12/2025')).toBe(true)
    })

    it('deve rejeitar formatos inválidos', () => {
      expect(isValidDateFormat('2025/01/15')).toBe(false)
      expect(isValidDateFormat('15-01-2025')).toBe(false)
      expect(isValidDateFormat('01/15/2025')).toBe(false)
      expect(isValidDateFormat('abc')).toBe(false)
    })

    it('deve rejeitar datas inválidas mesmo com formato correto', () => {
      expect(isValidDateFormat('2025-13-01')).toBe(false) // mês inválido
      expect(isValidDateFormat('32/01/2025')).toBe(false) // dia inválido
      expect(isValidDateFormat('2025-02-30')).toBe(false) // fevereiro não tem 30 dias
      expect(isValidDateFormat('2025-04-31')).toBe(false) // abril não tem 31 dias
      expect(isValidDateFormat('29/02/2025')).toBe(false) // 2025 não é bissexto
      expect(isValidDateFormat('30/02/2024')).toBe(false) // fevereiro não tem 30 dias mesmo em ano bissexto
      expect(isValidDateFormat('31/04/2025')).toBe(false) // abril não tem 31 dias
      expect(isValidDateFormat('31/06/2025')).toBe(false) // junho não tem 31 dias
      expect(isValidDateFormat('31/09/2025')).toBe(false) // setembro não tem 31 dias
      expect(isValidDateFormat('31/11/2025')).toBe(false) // novembro não tem 31 dias
    })

    it('deve aceitar datas válidas incluindo ano bissexto', () => {
      expect(isValidDateFormat('29/02/2024')).toBe(true) // 2024 é bissexto
      expect(isValidDateFormat('2024-02-29')).toBe(true) // 2024 é bissexto
      expect(isValidDateFormat('31/12/2025')).toBe(true) // dezembro tem 31 dias
      expect(isValidDateFormat('2025-01-31')).toBe(true) // janeiro tem 31 dias
      expect(isValidDateFormat('30/04/2025')).toBe(true) // abril tem 30 dias
      expect(isValidDateFormat('28/02/2025')).toBe(true) // fevereiro tem 28 dias em ano não bissexto
    })
  })

  describe('parseDate', () => {
    it('deve fazer parse de data ISO', () => {
      const date = parseDate('2025-01-15')
      expect(typeof date).toBe('string')
      expect(date).toBe('2025-01-15')
    })

    it('deve fazer parse de data dd/mm/yyyy', () => {
      const date = parseDate('15/01/2025')
      expect(typeof date).toBe('string')
      expect(date).toBe('2025-01-15')
    })

    it('deve retornar null para formatos inválidos', () => {
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('2025/01/15')).toBeNull()
      expect(parseDate('2025-13-01')).toBeNull() // mês inválido
      expect(parseDate('32/01/2025')).toBeNull() // dia inválido
      expect(parseDate('2025-02-30')).toBeNull() // fevereiro não tem 30 dias
      expect(parseDate('2025-04-31')).toBeNull() // abril não tem 31 dias
      expect(parseDate('29/02/2025')).toBeNull() // 2025 não é bissexto
    })

    it('deve aceitar datas válidas incluindo ano bissexto', () => {
      expect(parseDate('29/02/2024')).toBe('2024-02-29') // 2024 é bissexto
      expect(parseDate('31/12/2025')).toBe('2025-12-31') // dezembro tem 31 dias
      expect(parseDate('2025-01-31')).toBe('2025-01-31') // janeiro tem 31 dias
    })
  })

  describe('validateDate', () => {
    it('deve rejeitar data nula ou vazia', () => {
      expect(validateDate(null).isValid).toBe(false)
      expect(validateDate(undefined).isValid).toBe(false)
      expect(validateDate('').isValid).toBe(false)
      expect(validateDate('   ').isValid).toBe(false)
    })

    it('deve rejeitar formato inválido', () => {
      const result = validateDate('2025/01/15')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Formato de data inválido')
    })

    it('deve aceitar qualquer data válida, inclusive passada', () => {
      expect(validateDate('2025-01-14').isValid).toBe(true)
      expect(validateDate('2025-01-15').isValid).toBe(true)
      expect(validateDate('2025-06-15').isValid).toBe(true)
    })

    it('deve rejeitar data muito distante (mais de 2 anos)', () => {
      const result = validateDate('2027-02-01') // Mais de 2 anos
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('muito distante')
    })

    it('deve aceitar data no limite de 2 anos', () => {
      const result = validateDate('2027-01-14') // Exatamente 2 anos menos 1 dia
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateStartTime', () => {
    it('deve rejeitar horário nulo ou vazio', () => {
      expect(validateStartTime(null).isValid).toBe(false)
      expect(validateStartTime(undefined).isValid).toBe(false)
      expect(validateStartTime('').isValid).toBe(false)
    })

    it('deve rejeitar formato inválido', () => {
      const result = validateStartTime('10:3')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Formato inválido')
    })

    it('deve rejeitar horário fora do intervalo', () => {
      expect(validateStartTime('24:00').isValid).toBe(false)
      expect(validateStartTime('10:60').isValid).toBe(false)
      expect(validateStartTime('-01:00').isValid).toBe(false)
    })

    it('deve aceitar horário válido', () => {
      expect(validateStartTime('10:30').isValid).toBe(true)
      expect(validateStartTime('00:00').isValid).toBe(true)
      expect(validateStartTime('23:59').isValid).toBe(true)
    })

    it('deve aceitar qualquer horário válido', () => {
      expect(validateStartTime('09:30').isValid).toBe(true)
      expect(validateStartTime('11:00').isValid).toBe(true)
      expect(validateStartTime('08:00').isValid).toBe(true)
    })
  })

  describe('validateEndTime', () => {
    it('deve rejeitar horário nulo ou vazio', () => {
      expect(validateEndTime(null).isValid).toBe(false)
      expect(validateEndTime(undefined).isValid).toBe(false)
      expect(validateEndTime('').isValid).toBe(false)
    })

    it('deve rejeitar formato inválido', () => {
      const result = validateEndTime('10:3')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Formato inválido')
    })

    it('deve rejeitar horário fora do intervalo', () => {
      expect(validateEndTime('24:00').isValid).toBe(false)
      expect(validateEndTime('10:60').isValid).toBe(false)
    })

    it('deve aceitar horário válido', () => {
      expect(validateEndTime('10:30').isValid).toBe(true)
    })

    it('deve rejeitar horário de fim menor ou igual ao início', () => {
      expect(validateEndTime('10:00', '10:00').isValid).toBe(false)
      expect(validateEndTime('09:30', '10:00').isValid).toBe(false)
    })

    it('deve aceitar horário de fim maior que o início', () => {
      const result = validateEndTime('11:00', '10:00')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateEventDateTime', () => {
    it('deve validar todos os campos de uma vez', () => {
      const result = validateEventDateTime('2025-01-16', '10:00', '11:00')
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('deve retornar todos os erros quando múltiplos campos são inválidos', () => {
      const result = validateEventDateTime('2025-13-01', '25:00', '09:00')
      expect(result.isValid).toBe(false)
      expect(result.errors.date).toBeDefined()
      expect(result.errors.startTime).toBeDefined()
      // endTime pode não ter erro se startTime for inválido, pois a validação de endTime depende de startTime
      // Vamos usar um caso onde todos os três campos são claramente inválidos
      const result2 = validateEventDateTime('2025-13-01', '25:00', '26:00')
      expect(result2.isValid).toBe(false)
      expect(result2.errors.date).toBeDefined()
      expect(result2.errors.startTime).toBeDefined()
      expect(result2.errors.endTime).toBeDefined()
    })

    it('deve rejeitar data com mês inválido', () => {
      const result = validateEventDateTime('2025-13-01', '10:00', '11:00')
      expect(result.isValid).toBe(false)
      expect(result.errors.date).toBeDefined()
      expect(result.errors.date).toContain('Formato de data inválido')
    })

    it('deve rejeitar data com dia inválido para o mês', () => {
      const result = validateEventDateTime('2025-02-30', '10:00', '11:00')
      expect(result.isValid).toBe(false)
      expect(result.errors.date).toBeDefined()
      expect(result.errors.date).toContain('Formato de data inválido')
    })

    // Validação de relação entre data e hora de início removida, pois eventos no passado são permitidos

    it('deve validar relação entre hora de início e fim', () => {
      const result = validateEventDateTime('2025-01-16', '11:00', '10:00')
      expect(result.isValid).toBe(false)
      expect(result.errors.endTime).toContain('maior que o de início')
    })

    it('deve validar cenários reais de eventos', () => {
      // Evento hoje com horários válidos
      expect(
        validateEventDateTime('2025-01-15', '09:00', '10:00').isValid
      ).toBe(true)

      // Evento no passado com horários válidos
      expect(
        validateEventDateTime('2025-01-14', '14:00', '15:30').isValid
      ).toBe(true)

      // Evento futuro com horários válidos
      expect(
        validateEventDateTime('2025-06-15', '08:00', '12:00').isValid
      ).toBe(true)

      // Evento com data inválida
      const invalidDate = validateEventDateTime('2025/01/15', '09:00', '10:00')
      expect(invalidDate.isValid).toBe(false)
      expect(invalidDate.errors.date).toBeDefined()

      // Evento com horário de início inválido
      const invalidStart = validateEventDateTime('2025-01-16', '25:00', '10:00')
      expect(invalidStart.isValid).toBe(false)
      expect(invalidStart.errors.startTime).toBeDefined()

      // Evento com horário de fim inválido
      const invalidEnd = validateEventDateTime('2025-01-16', '09:00', '25:00')
      expect(invalidEnd.isValid).toBe(false)
      expect(invalidEnd.errors.endTime).toBeDefined()

      // Evento com fim antes do início
      const endBeforeStart = validateEventDateTime(
        '2025-01-16',
        '11:00',
        '10:00'
      )
      expect(endBeforeStart.isValid).toBe(false)
      expect(endBeforeStart.errors.endTime).toContain('maior que o de início')
    })
  })

  describe('validateFileDate', () => {
    it('deve rejeitar data nula ou vazia para upload', () => {
      expect(validateFileDate(null, 'upload').isValid).toBe(false)
      expect(validateFileDate(undefined, 'upload').isValid).toBe(false)
      expect(validateFileDate('', 'upload').isValid).toBe(false)
      expect(validateFileDate('   ', 'upload').isValid).toBe(false)
    })

    it('deve rejeitar data nula ou vazia para expiry', () => {
      expect(validateFileDate(null, 'expiry').isValid).toBe(false)
      expect(validateFileDate(undefined, 'expiry').isValid).toBe(false)
      expect(validateFileDate('', 'expiry').isValid).toBe(false)
      expect(validateFileDate('   ', 'expiry').isValid).toBe(false)
    })

    it('deve rejeitar formato inválido', () => {
      const result = validateFileDate('15/01/2025', 'upload')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Formato de data inválido')
    })

    it('deve aceitar data de upload hoje ou no passado', () => {
      expect(validateFileDate('2025-01-14', 'upload').isValid).toBe(true) // passado
      expect(validateFileDate('2025-01-15', 'upload').isValid).toBe(true) // hoje (mockado)
    })

    it('deve rejeitar data de upload no futuro', () => {
      const result = validateFileDate('2025-01-16', 'upload')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('não pode ser no futuro')
    })

    it('deve aceitar qualquer data válida para expiry', () => {
      expect(validateFileDate('2025-01-14', 'expiry').isValid).toBe(true) // passado
      expect(validateFileDate('2025-01-15', 'expiry').isValid).toBe(true) // hoje
      expect(validateFileDate('2025-01-16', 'expiry').isValid).toBe(true) // futuro
    })
  })

  // Novos testes para aumentar cobertura
  describe('Cenários de borda e validações adicionais', () => {
    it('deve validar datas em diferentes formatos de entrada', () => {
      // Teste com diferentes formatos aceitos
      expect(validateDate('2025-01-15').isValid).toBe(true) // ISO
      expect(validateDate('15/01/2025').isValid).toBe(true) // BR
    })

    it('deve validar horários em diferentes intervalos', () => {
      // Horários válidos
      expect(validateStartTime('00:00').isValid).toBe(true)
      expect(validateStartTime('23:59').isValid).toBe(true)
      expect(validateEndTime('00:01', '00:00').isValid).toBe(true)
    })

    it('deve rejeitar datas com componentes inválidos', () => {
      expect(validateDate('2025-13-01').isValid).toBe(false) // mês inválido
      expect(validateDate('32/01/2025').isValid).toBe(false) // dia inválido
      expect(validateDate('2025-02-30').isValid).toBe(false) // fevereiro não tem 30 dias
      expect(validateDate('2025-04-31').isValid).toBe(false) // abril não tem 31 dias
      expect(validateDate('29/02/2025').isValid).toBe(false) // 2025 não é bissexto
      expect(validateDate('29/02/2024').isValid).toBe(true) // 2024 é bissexto
      expect(validateDate('31/12/2025').isValid).toBe(true) // dezembro tem 31 dias
    })

    it('deve validar combinação de data e horário para eventos', () => {
      // Evento válido
      const valid = validateEventDateTime('2025-01-16', '09:00', '10:00')
      expect(valid.isValid).toBe(true)

      // Evento com problemas múltiplos
      const invalid = validateEventDateTime('', '25:00', '24:00')
      expect(invalid.isValid).toBe(false)
      expect(Object.keys(invalid.errors).length).toBe(3)
    })

    it('deve validar datas de arquivo em diferentes contextos', () => {
      // Upload hoje
      expect(validateFileDate('2025-01-15', 'upload').isValid).toBe(true)

      // Expiry futuro
      expect(validateFileDate('2026-01-15', 'expiry').isValid).toBe(true)

      // Upload futuro (inválido)
      expect(validateFileDate('2025-01-16', 'upload').isValid).toBe(false)
    })
  })
})
