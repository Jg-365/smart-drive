import { z } from 'zod'
import { FuelType } from '@/features/shared/types'

// Espelha o sanitizeText do backend (backend/smart-drive/src/vehicles/dto/sanitize-text.ts):
// apara as pontas, colapsa espaços internos e descarta caracteres que não sejam letras,
// números, espaço ou pontuação comum (-, ', ., parênteses) — sem rejeitar o valor.
export function sanitizeText(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s\-'.()]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const MIN_YEAR = 1900
const MAX_YEAR = new Date().getFullYear() + 1

// Texto livre (marca/modelo): sanitiza e exige não-vazio depois de sanitizado —
// strings só com espaços ou só com caracteres especiais viram vazio → rejeitadas.
const sanitizedText = (field: string) =>
  z
    .string({ message: `${field} é obrigatório` })
    .transform(sanitizeText)
    .refine((v) => v.length > 0, { message: `${field} é obrigatório` })

// Texto que só apara espaços (motor).
const trimmedText = (field: string) =>
  z
    .string({ message: `${field} é obrigatório` })
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, { message: `${field} é obrigatório` })

// Número positivo a partir de input de formulário (string). '' → NaN → erro;
// 0 e negativos → rejeitados por .positive().
const positiveNumber = (field: string) =>
  z.coerce
    .number({ message: `${field} deve ser um número` })
    .positive({ message: `${field} deve ser maior que zero` })

/**
 * Validação do formulário de veículo (JOA-RF-01/02). Recebe os campos como strings
 * (estado dos inputs) e devolve um objeto tipado pronto para a API. As regras
 * espelham o CreateVehicleDto do backend para falhar cedo no cliente.
 */
export const vehicleFormSchema = z.object({
  brand: sanitizedText('Marca'),
  model: sanitizedText('Modelo'),
  year: z.coerce
    .number({ message: 'Ano deve ser um número' })
    .int({ message: 'Ano deve ser inteiro' })
    .min(MIN_YEAR, { message: `Ano deve ser >= ${MIN_YEAR}` })
    .max(MAX_YEAR, { message: `Ano deve ser <= ${MAX_YEAR}` }),
  engine: trimmedText('Motor'),
  fuelType: z.enum(FuelType, { message: 'Selecione o tipo de combustível' }),
  tankCapacityLiters: positiveNumber('Capacidade do tanque'),
  baseUrbanConsumptionKmL: positiveNumber('Consumo urbano'),
  baseHighwayConsumptionKmL: positiveNumber('Consumo rodoviário'),
  baseMixedConsumptionKmL: positiveNumber('Consumo misto'),
  // Peso é opcional: vazio → undefined; se informado, deve ser positivo.
  weightKg: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    positiveNumber('Peso').optional(),
  ),
})

export type VehicleFormValues = z.input<typeof vehicleFormSchema>
export type VehicleFormParsed = z.output<typeof vehicleFormSchema>

/** Erros por campo (campo → mensagem), prontos para exibir no formulário. */
export type VehicleFormErrors = Partial<Record<keyof VehicleFormValues, string>>

export interface ValidationResult {
  success: boolean
  data?: VehicleFormParsed
  errors: VehicleFormErrors
}

/** Valida os valores crus do formulário e devolve dados parseados ou erros por campo. */
export function validateVehicleForm(raw: Record<string, unknown>): ValidationResult {
  const result = vehicleFormSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data, errors: {} }
  }
  const errors: VehicleFormErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof VehicleFormValues | undefined
    if (key && !errors[key]) errors[key] = issue.message
  }
  return { success: false, errors }
}
