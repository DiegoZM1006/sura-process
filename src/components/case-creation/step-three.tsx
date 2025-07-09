"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SaveIcon } from "lucide-react"

interface StepThreeProps {
  onPrev: () => void
  onFinish: () => void
  currentStep: number
}

export function StepThree({ onPrev, onFinish, currentStep }: StepThreeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisión y Finalización</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Previsualización del Caso
          </h3>
          <p className="text-gray-500">
            Este paso será implementado próximamente.
          </p>
          <p className="text-gray-500 mt-2">
            Aquí podrás revisar toda la información antes de crear el caso.
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="pt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={onPrev}
            className="flex-1"
          >
            Anterior
          </Button>
          <Button
            onClick={onFinish}
            className="flex-1 bg-[#182A76] hover:bg-[#182A76]/90"
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            Finalizar Caso
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
