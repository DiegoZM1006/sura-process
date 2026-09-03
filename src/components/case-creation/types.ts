/**
 * Tipos compartidos entre los pasos del wizard de creación de casos
 * (step-one, step-two, step-three) y la página que los orquesta
 * (app/(layout)/cases/create/page.tsx).
 */

export interface CaseFormData {
  nombreEmpresa: string
  nitEmpresa: string
  correoEmpresa: string | string[]
  direccionEmpresa: string | string[]
  telefonoEmpresa: string
  diaAccidente: string
  mesAccidente: string
  añoAccidente: string
  direccionAccidente: string
  ciudad: string
  departamento: string
  placasPrimerVehiculo: string
  propietarioPrimerVehiculo: string
  placasSegundoVehiculo: string
  propietarioSegundoVehiculo: string
  afiliador: string
  conductorVehiculoInfractor: string
  cedulaConductorInfractor: string
  numeroPolizaSura: string
  cuantia: string
  deducible: string
  anexos: File[]
}

/** Imagen insertada en el documento vía el editor (TiptapEditor). */
export interface DocumentImage {
  id: string
  name: string
  data: string
  file: File
  width: number
  height: number
}
