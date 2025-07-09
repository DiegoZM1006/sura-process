"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaveIcon } from "lucide-react"

interface StepOneProps {
  formData: {
    nombreRazonSocial: string
    nit: string
    correo: string
    fechaAccidente: string
    direccionSucedido: string
    ciudadSucedido: string
    departamentoSucedido: string
    placas1erImplicado: string
    propietario1erVehiculo: string
    placas2doImplicado: string
    propietario2doVehiculo: string
    conductorVehiculo: string
    ccConductor: string
    cuantias: string
    polizaAsegurado: string
  }
  handleInputChange: (field: string, value: string) => void
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
        <div className="grid gap-2">
          <Label htmlFor="nombreRazonSocial">
            Nombre o Razón Social <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nombreRazonSocial"
            value={formData.nombreRazonSocial}
            onChange={(e) => handleInputChange('nombreRazonSocial', e.target.value)}
            placeholder="Ingrese nombre o razón social"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nit">
            NIT <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nit"
            value={formData.nit}
            onChange={(e) => handleInputChange('nit', e.target.value)}
            placeholder="Ingrese NIT"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="correo">
            Correo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="correo"
            type="email"
            value={formData.correo}
            onChange={(e) => handleInputChange('correo', e.target.value)}
            placeholder="Ingrese correo electrónico"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="fechaAccidente">
            Fecha Accidente <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fechaAccidente"
            type="date"
            value={formData.fechaAccidente}
            onChange={(e) => handleInputChange('fechaAccidente', e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="direccionSucedido">
            Dirección de lo Sucedido <span className="text-red-500">*</span>
          </Label>
          <Input
            id="direccionSucedido"
            value={formData.direccionSucedido}
            onChange={(e) => handleInputChange('direccionSucedido', e.target.value)}
            placeholder="Ingrese dirección del accidente"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ciudadSucedido">
            Ciudad de lo Sucedido <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ciudadSucedido"
            value={formData.ciudadSucedido}
            onChange={(e) => handleInputChange('ciudadSucedido', e.target.value)}
            placeholder="Ciudad"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="departamentoSucedido">
            Departamento <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.departamentoSucedido} onValueChange={(value) => handleInputChange('departamentoSucedido', value)} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="antioquia">Antioquia</SelectItem>
              <SelectItem value="bogota">Bogotá D.C.</SelectItem>
              <SelectItem value="valle">Valle del Cauca</SelectItem>
              <SelectItem value="cundinamarca">Cundinamarca</SelectItem>
              <SelectItem value="atlantico">Atlántico</SelectItem>
              <SelectItem value="santander">Santander</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="placas1erImplicado">
            Placas 1er Implicado <span className="text-red-500">*</span>
          </Label>
          <Input
            id="placas1erImplicado"
            value={formData.placas1erImplicado}
            onChange={(e) => handleInputChange('placas1erImplicado', e.target.value)}
            placeholder="ABC-123"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="propietario1erVehiculo">
            Propietario 1er Vehículo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="propietario1erVehiculo"
            value={formData.propietario1erVehiculo}
            onChange={(e) => handleInputChange('propietario1erVehiculo', e.target.value)}
            placeholder="Nombre"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="placas2doImplicado">
            Placas 2do Implicado <span className="text-red-500">*</span>
          </Label>
          <Input
            id="placas2doImplicado"
            value={formData.placas2doImplicado}
            onChange={(e) => handleInputChange('placas2doImplicado', e.target.value)}
            placeholder="XYZ-456"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="propietario2doVehiculo">
            Propietario 2do Vehículo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="propietario2doVehiculo"
            value={formData.propietario2doVehiculo}
            onChange={(e) => handleInputChange('propietario2doVehiculo', e.target.value)}
            placeholder="Nombre"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="conductorVehiculo">
            Conductor Vehículo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="conductorVehiculo"
            value={formData.conductorVehiculo}
            onChange={(e) => handleInputChange('conductorVehiculo', e.target.value)}
            placeholder="Nombre del conductor"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ccConductor">
            CC Conductor <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ccConductor"
            value={formData.ccConductor}
            onChange={(e) => handleInputChange('ccConductor', e.target.value)}
            placeholder="Cédula de ciudadanía"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cuantias">
            Cuantías <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cuantias"
            value={formData.cuantias}
            onChange={(e) => handleInputChange('cuantias', e.target.value)}
            placeholder="Valor estimado de daños"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="polizaAsegurado">
            # Póliza del Asegurado <span className="text-red-500">*</span>
          </Label>
          <Input
            id="polizaAsegurado"
            value={formData.polizaAsegurado}
            onChange={(e) => handleInputChange('polizaAsegurado', e.target.value)}
            placeholder="Número de póliza"
            required
          />
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
