"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { CheckIcon } from "lucide-react"
import TiptapEditor from "@/components/tiptap-editor"
import { StepOne } from "@/components/case-creation/step-one"
import { StepTwo } from "@/components/case-creation/step-two"
import { StepThree } from "@/components/case-creation/step-three"
import { EditorFooter } from "@/components/case-creation/editor-footer"

// Mapeo de tipos de casos
const CASE_TYPE_MAPPING: Record<string, string> = {
    "rce-danos": "RCE DAÑOS",
    "rce-hurto": "RCE HURTO",
    "rce-solo-deducible": "RCE SOLO DEDUCIBLE",
    "rce-danos-deducible": "RCE DAÑOS + DEDUCIBLE",
    "rce-danos-objecion": "RCE DAÑOS + OBJECION",
    "rce-danos-deducible-objecion": "RCE DAÑOS + DEDUCIBLE + OBJECION",
    "rce-hurto-deducible": "RCE HURTO + DEDUCIBLE",

    // TODO: Por verificar si es correcto
    "rce-solo-deducible-objecion": "RCE SOLO DEDUCIBLE + OBJECION",
}

export default function CreateCasePage() {
    const searchParams = useSearchParams()
    const [currentStep, setCurrentStep] = useState(1)
    const [caseType, setCaseType] = useState<string>("")
    const [documentImages, setDocumentImages] = useState<any[]>([]) // Nuevo estado para imágenes
    const [steps, setSteps] = useState([
        { id: 1, name: "Información Básica", status: "current" },
        { id: 2, name: "Anexos", status: "upcoming" },
        { id: 3, name: "Revisión", status: "upcoming" },
    ])
    const [formData, setFormData] = useState({
        nombreEmpresa: "",
        nitEmpresa: "",
        correoEmpresa: "",
        direccionEmpresa: "",
        telefonoEmpresa: "",
        diaAccidente: "",
        mesAccidente: "",
        añoAccidente: "",
        direccionAccidente: "",
        ciudad: "",
        departamento: "",
        placasPrimerVehiculo: "",
        propietarioPrimerVehiculo: "",
        placasSegundoVehiculo: "",
        propietarioSegundoVehiculo: "",
        afiliador: "",
        conductorVehiculoInfractor: "",
        cedulaConductorInfractor: "",
        numeroPolizaSura: "",
        deducible: "", // Añadir deducible
        cuantia: "",
        anexos: [] as File[], // Añadir anexos persistentes
    })

    // Obtener el tipo de caso de los parámetros de búsqueda
    useEffect(() => {
        const typeCase = searchParams?.get('typeCase')
        if (typeCase && CASE_TYPE_MAPPING[typeCase]) {
            setCaseType(CASE_TYPE_MAPPING[typeCase])
        }
    }, [searchParams])

    const handleInputChange = (field: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: typeof value === 'string' ? value : (Array.isArray(value) ? value.join(', ') : '') }))
    }

    // Handler para cambios en las imágenes
    const handleImagesChange = (images: any[]) => {
        setDocumentImages(images)
        console.log('Imágenes actualizadas:', images.length)
    }

    const nextStep = () => {
        if (currentStep < steps.length) {
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

    const isStepComplete = () => {
        // Para testing - siempre permite continuar
        return true
        
        // Código original para cuando quieras reactivar validaciones:
        // if (currentStep === 1) {
        //     return Object.values(formData).every(value => value.trim() !== '')
        // }
        // return true
    }

    const handleFinish = () => {
        console.log('Caso finalizado exitosamente:', formData)
        console.log('Imágenes del documento:', documentImages.length)
        // Aquí iría la lógica para guardar el caso en la base de datos
        // Por ejemplo, redirigir a la lista de casos
        alert('Caso creado y enviado exitosamente!')
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <StepOne
                        formData={formData}
                        handleInputChange={handleInputChange}
                        onNext={nextStep}
                        onPrev={prevStep}
                        isStepComplete={isStepComplete}
                        currentStep={currentStep}
                    />
                )
            case 2:
                return (
                    <StepTwo
                        formData={formData}
                        updateFormData={setFormData}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                )
            case 3:
                return (
                    <StepThree
                        onPrev={prevStep}
                        onFinish={handleFinish}
                        currentStep={currentStep}
                        caseType={caseType}
                        formData={formData}
                        documentImages={documentImages} // Pasar imágenes al Step 3
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header con Stepper */}
            <div className="border-b bg-white p-6">
                <h1 className="text-2xl font-bold mb-6">Crear Nuevo Caso ({caseType || 'Cargando caso...'})</h1>

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
                {currentStep === 3 ? (
                    /* Step 3 - Editor a pantalla completa */
                    <div className="w-full">
                        {renderStepContent()}
                    </div>
                ) : (
                    /* Steps 1 y 2 - Layout dividido */
                    <>
                        {/* Formulario/Contenido del paso - 1/3 del ancho */}
                        <div className="w-1/3">
                            {renderStepContent()}
                        </div>

                        {/* Editor - 2/3 del ancho */}
                        <div className="w-2/3">
                            <div className="h-[calc(100vh-100px)] sticky top-6 overflow-hidden flex flex-col">
                                <div className="flex-1 overflow-hidden">
                                    <TiptapEditor 
                                        formData={formData} 
                                        caseType={caseType}
                                        onImagesChange={handleImagesChange} // Pasar callback de imágenes
                                    />
                                </div>
                                <EditorFooter
                                    currentStep={currentStep}
                                    totalSteps={steps.length}
                                    onNext={nextStep}
                                    onPrev={currentStep > 1 ? prevStep : undefined}
                                    onFinish={currentStep === steps.length ? handleFinish : undefined}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
