"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckIcon, SaveIcon } from "lucide-react"

export default function CreateCasePage() {
    const [currentStep, setCurrentStep] = useState(1)
    const [steps, setSteps] = useState([
        { id: 1, name: "Información Básica", status: "current" },
        { id: 2, name: "Documentos", status: "upcoming" },
        { id: 3, name: "Revisión", status: "upcoming" },
    ])
    const [formData, setFormData] = useState({
        nombreRazonSocial: "",
        nit: "",
        correo: "",
        fechaAccidente: "",
        direccionSucedido: "",
        ciudadSucedido: "",
        departamentoSucedido: "",
        placas1erImplicado: "",
        propietario1erVehiculo: "",
        placas2doImplicado: "",
        propietario2doVehiculo: "",
        conductorVehiculo: "",
        ccConductor: "",
        cuantias: "",
        polizaAsegurado: "",
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const nextStep = () => {
        if (currentStep < steps.length) {
            // Actualizar el estado del paso actual a completado
            setSteps(prevSteps => prevSteps.map(step => {
                if (step.id === currentStep) {
                    return { ...step, status: 'complete' }
                } else if (step.id === currentStep + 1) {
                    return { ...step, status: 'current' }
                } else {
                    return step
                }
            }))

            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            // Actualizar el estado del paso actual y anterior
            setSteps(prevSteps => prevSteps.map(step => {
                if (step.id === currentStep) {
                    return { ...step, status: 'upcoming' }
                } else if (step.id === currentStep - 1) {
                    return { ...step, status: 'current' }
                } else if (step.id < currentStep - 1) {
                    return { ...step, status: 'complete' }
                } else {
                    return step
                }
            }))

            setCurrentStep(currentStep - 1)
        }
    }

    // Función para verificar si todos los campos requeridos están completos
    const isStepComplete = () => {
        if (currentStep === 1) {
            return Object.values(formData).every(value => value.trim() !== '')
        }
        return true // Para otros pasos, agregar validaciones según sea necesario
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header con Stepper */}
            <div className="border-b bg-white p-6">
                <h1 className="text-2xl font-bold mb-6">Crear Nuevo Caso</h1>

                {/* Stepper funcional */}
                <nav aria-label="Progress">
                    <ol className="flex items-center w-full">
                        {steps.map((step, stepIdx) => (
                            <li key={step.name} className={`flex items-center ${stepIdx !== steps.length - 1 ? 'w-full' : ''}`}>
                                <div className="flex items-center">
                                    {/* Círculo del paso */}
                                    <div className="relative flex h-8 w-8 items-center justify-center">
                                        {step.status === 'complete' ? (
                                            <div className="h-8 w-8 rounded-full bg-[#182A76] flex items-center justify-center">
                                                <CheckIcon className="h-5 w-5 text-white" />
                                            </div>
                                        ) : step.status === 'current' ? (
                                            <div className="h-8 w-8 rounded-full border-2 border-[#182A76] bg-white flex items-center justify-center">
                                                <span className="text-[#182A76] text-sm font-medium">{step.id}</span>
                                            </div>
                                        ) : (
                                            <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                                                <span className="text-gray-500 text-sm font-medium">{step.id}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Texto del paso */}
                                    <span className={`ml-3 text-sm font-medium ${step.status === 'current' ? 'text-[#182A76]' :
                                            step.status === 'complete' ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {step.name}
                                    </span>
                                </div>

                                {/* Línea conectora */}
                                {stepIdx !== steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-4 ${step.status === 'complete' ? 'bg-[#182A76]' : 'bg-gray-300'
                                        }`} />
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 flex p-4 gap-6">
                {/* Formulario - 1/3 del ancho */}
                <div className="w-1/3">
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
                                {currentStep > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={prevStep}
                                        className="flex-1"
                                    >
                                        Anterior
                                    </Button>
                                )}
                                <Button
                                    onClick={currentStep === steps.length ? () => console.log('Finalizar') : nextStep}
                                    disabled={!isStepComplete()}
                                    className={`${currentStep === 1 ? 'w-full' : 'flex-1'} bg-[#182A76] hover:bg-[#182A76]/90`}
                                >
                                    <>
                                        <SaveIcon className="h-4 w-4" />
                                        Guardar
                                    </>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Editor - 2/3 del ancho */}
                <div className="w-2/3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Editor de Texto</CardTitle>
                        </CardHeader>
                        <CardContent className="h-full">
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <p className="text-lg">Editor de texto será implementado aquí</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}