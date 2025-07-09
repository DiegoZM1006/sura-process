"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

interface EditorFooterProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev?: () => void
  onFinish?: () => void
}

export function EditorFooter({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onFinish
}: EditorFooterProps) {
  const isLastStep = currentStep === totalSteps

  return (
    <Card className="mt-4 p-0">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Paso {currentStep} de {totalSteps}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 1 && onPrev && (
              <Button
                variant="outline"
                onClick={onPrev}
                size="sm"
              >
                Anterior
              </Button>
            )}
            
            {isLastStep ? (
              onFinish && (
                <Button
                  onClick={onFinish}
                  className="bg-[#182A76] hover:bg-[#182A76]/90"
                  size="sm"
                >
                  Finalizar
                </Button>
              )
            ) : (
              <Button
                onClick={onNext}
                className="bg-[#182A76] hover:bg-[#182A76]/90"
                size="sm"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
