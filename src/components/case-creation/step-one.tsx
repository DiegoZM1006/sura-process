"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MultiEmailInput } from "./multi-email-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaveIcon } from "lucide-react"

interface StepOneProps {
  formData: {
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
    conductorVehiculoInfractor: string
    cedulaConductorInfractor: string
    numeroPolizaSura: string
    cuantia: string
  }
  handleInputChange: (field: string, value: string | string[]) => void
  onNext: () => void
  onPrev?: () => void
  isStepComplete: () => boolean
  currentStep: number
}

export function StepOne({
  formData,
  handleInputChange,
  onNext,
  onPrev,
  isStepComplete,
  currentStep
}: StepOneProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campos Requeridos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información de la Empresa */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">Información de la Empresa</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="nombreEmpresa">
              1. Nombre Empresa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombreEmpresa"
              value={formData.nombreEmpresa}
              onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
              placeholder="Ingrese nombre de la empresa"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nitEmpresa">
              2. NIT Empresa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nitEmpresa"
              value={formData.nitEmpresa}
              onChange={(e) => handleInputChange('nitEmpresa', e.target.value)}
              placeholder="Ingrese NIT de la empresa"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="direccionEmpresa">
              3. Dirección Empresa
            </Label>
            <Input
              id="direccionEmpresa"
              value={typeof formData.direccionEmpresa === 'string' ? formData.direccionEmpresa : (Array.isArray(formData.direccionEmpresa) ? formData.direccionEmpresa.join(', ') : '')}
              onChange={(e) => handleInputChange('direccionEmpresa', e.target.value)}
              placeholder="Ingrese dirección de la empresa (opcional)"
              className="block w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <MultiEmailInput
              value={Array.isArray(formData.correoEmpresa) ? formData.correoEmpresa : (formData.correoEmpresa ? [formData.correoEmpresa] : [])}
              onChange={(emails) => handleInputChange('correoEmpresa', emails)}
              label="4. Correos Empresa"
              placeholder="Ingrese correo y presione Enter o +"
              id="correoEmpresa"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefonoEmpresa">
              5. Teléfono Empresa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="telefonoEmpresa"
              type="tel"
              value={formData.telefonoEmpresa}
              onChange={(e) => handleInputChange('telefonoEmpresa', e.target.value)}
              placeholder="Ingrese teléfono de la empresa"
              required
            />
          </div>
        </div>

        {/* Información del Accidente */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">Información del Accidente</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="diaAccidente">
                6. Día del Accidente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="diaAccidente"
                type="number"
                min="1"
                max="31"
                value={formData.diaAccidente}
                onChange={(e) => handleInputChange('diaAccidente', e.target.value)}
                placeholder="DD"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mesAccidente">
                7. Mes del Accidente <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.mesAccidente} onValueChange={(value) => handleInputChange('mesAccidente', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enero">Enero</SelectItem>
                  <SelectItem value="febrero">Febrero</SelectItem>
                  <SelectItem value="marzo">Marzo</SelectItem>
                  <SelectItem value="abril">Abril</SelectItem>
                  <SelectItem value="mayo">Mayo</SelectItem>
                  <SelectItem value="junio">Junio</SelectItem>
                  <SelectItem value="julio">Julio</SelectItem>
                  <SelectItem value="agosto">Agosto</SelectItem>
                  <SelectItem value="septiembre">Septiembre</SelectItem>
                  <SelectItem value="octubre">Octubre</SelectItem>
                  <SelectItem value="noviembre">Noviembre</SelectItem>
                  <SelectItem value="diciembre">Diciembre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="añoAccidente">
                8. Año del Accidente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="añoAccidente"
                type="number"
                min="2000"
                max="2030"
                value={formData.añoAccidente}
                onChange={(e) => handleInputChange('añoAccidente', e.target.value)}
                placeholder="YYYY"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="direccionAccidente">
              9. Dirección del Accidente <span className="text-red-500">*</span>
            </Label>
            <Input
              id="direccionAccidente"
              value={formData.direccionAccidente}
              onChange={(e) => handleInputChange('direccionAccidente', e.target.value)}
              placeholder="Ingrese dirección donde ocurrió el accidente"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ciudad">
              10. Ciudad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ciudad"
              value={formData.ciudad}
              onChange={(e) => handleInputChange('ciudad', e.target.value)}
              placeholder="Ingrese ciudad"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="departamento">
              11. Departamento <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.departamento} onValueChange={(value) => handleInputChange('departamento', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Amazonas">Amazonas</SelectItem>
                <SelectItem value="Antioquia">Antioquia</SelectItem>
                <SelectItem value="Arauca">Arauca</SelectItem>
                <SelectItem value="Atlántico">Atlántico</SelectItem>
                <SelectItem value="Bolívar">Bolívar</SelectItem>
                <SelectItem value="Boyacá">Boyacá</SelectItem>
                <SelectItem value="Caldas">Caldas</SelectItem>
                <SelectItem value="Caquetá">Caquetá</SelectItem>
                <SelectItem value="Casanare">Casanare</SelectItem>
                <SelectItem value="Cauca">Cauca</SelectItem>
                <SelectItem value="Cesar">Cesar</SelectItem>
                <SelectItem value="Chocó">Chocó</SelectItem>
                <SelectItem value="Córdoba">Córdoba</SelectItem>
                <SelectItem value="Cundinamarca">Cundinamarca</SelectItem>
                <SelectItem value="Guainía">Guainía</SelectItem>
                <SelectItem value="Guaviare">Guaviare</SelectItem>
                <SelectItem value="Huila">Huila</SelectItem>
                <SelectItem value="La Guajira">La Guajira</SelectItem>
                <SelectItem value="Magdalena">Magdalena</SelectItem>
                <SelectItem value="Meta">Meta</SelectItem>
                <SelectItem value="Nariño">Nariño</SelectItem>
                <SelectItem value="Norte de Santander">Norte de Santander</SelectItem>
                <SelectItem value="Putumayo">Putumayo</SelectItem>
                <SelectItem value="Quindío">Quindío</SelectItem>
                <SelectItem value="Risaralda">Risaralda</SelectItem>
                <SelectItem value="San Andrés y Providencia">San Andrés y Providencia</SelectItem>
                <SelectItem value="Santander">Santander</SelectItem>
                <SelectItem value="Sucre">Sucre</SelectItem>
                <SelectItem value="Tolima">Tolima</SelectItem>
                <SelectItem value="Valle del Cauca">Valle del Cauca</SelectItem>
                <SelectItem value="Vaupés">Vaupés</SelectItem>
                <SelectItem value="Vichada">Vichada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Información de los Vehículos */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">Información de los Vehículos</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="placasPrimerVehiculo">
              12. Placas Primer Vehículo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="placasPrimerVehiculo"
              value={formData.placasPrimerVehiculo}
              onChange={(e) => handleInputChange('placasPrimerVehiculo', e.target.value)}
              placeholder="ABC123"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="propietarioPrimerVehiculo">
              13. Propietario Primer Vehículo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="propietarioPrimerVehiculo"
              value={formData.propietarioPrimerVehiculo}
              onChange={(e) => handleInputChange('propietarioPrimerVehiculo', e.target.value)}
              placeholder="Nombre del propietario"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="placasSegundoVehiculo">
              14. Placas Segundo Vehículo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="placasSegundoVehiculo"
              value={formData.placasSegundoVehiculo}
              onChange={(e) => handleInputChange('placasSegundoVehiculo', e.target.value)}
              placeholder="XYZ789"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="propietarioSegundoVehiculo">
              15. Propietario Segundo Vehículo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="propietarioSegundoVehiculo"
              value={formData.propietarioSegundoVehiculo}
              onChange={(e) => handleInputChange('propietarioSegundoVehiculo', e.target.value)}
              placeholder="Nombre del propietario"
              required
            />
          </div>
        </div>

        {/* Información del Conductor Infractor */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">Información del Conductor Infractor</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="conductorVehiculoInfractor">
              16. Conductor Vehículo Infractor <span className="text-red-500">*</span>
            </Label>
            <Input
              id="conductorVehiculoInfractor"
              value={formData.conductorVehiculoInfractor}
              onChange={(e) => handleInputChange('conductorVehiculoInfractor', e.target.value)}
              placeholder="Nombre del conductor"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cedulaConductorInfractor">
              17. Cédula del Conductor Infractor <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cedulaConductorInfractor"
              value={formData.cedulaConductorInfractor}
              onChange={(e) => handleInputChange('cedulaConductorInfractor', e.target.value)}
              placeholder="1234567890"
              required
            />
          </div>
        </div>

        {/* Información Económica y Póliza */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">Información Económica y Póliza</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="numeroPolizaSura">
              18. Número de Póliza Sura <span className="text-red-500">*</span>
            </Label>
            <Input
              id="numeroPolizaSura"
              value={formData.numeroPolizaSura}
              onChange={(e) => handleInputChange('numeroPolizaSura', e.target.value)}
              placeholder="Número de póliza"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cuantia">
              19. Cuantía (Cantidad de dinero por todos los daños) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cuantia"
              type="number"
              value={formData.cuantia}
              onChange={(e) => handleInputChange('cuantia', e.target.value)}
              placeholder="$0"
              required
            />
          </div>
        </div>

        <div className="pt-4 flex gap-2">
          {currentStep > 1 && onPrev && (
            <Button
              variant="outline"
              onClick={onPrev}
              className="flex-1"
            >
              Anterior
            </Button>
          )}
          <Button
            onClick={onNext}
            disabled={false} // Remover validación para testing
            className={`${currentStep === 1 ? 'w-full' : 'flex-1'} bg-[#182A76] hover:bg-[#182A76]/90`}
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
