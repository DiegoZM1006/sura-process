"use client"

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { useState } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Opciones de casos - puedes modificar estas opciones según tus necesidades
const CASE_OPTIONS = [
  { value: "rce-daños", label: "RECLAMACION RCE DAÑOS" },
  { value: "rce-hurto", label: "RECLAMACION RCE HURTO" }
]

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCaseType, setSelectedCaseType] = useState<string>("")
  const router = useRouter();

  const handleCreateCase = () => {
    if (selectedCaseType) {
      // Aquí puedes agregar la lógica para crear el caso
      console.log("Creando caso de tipo:", selectedCaseType)
      router.push(`/cases/create?typeCase=${selectedCaseType}`)
      setIsDialogOpen(false)
      setSelectedCaseType("")
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-[#182A76] text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconCirclePlusFilled />
                  <span>Crear caso</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Caso</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="case-type" className="text-sm font-medium">
                      Tipo de Caso
                    </label>
                    <Select value={selectedCaseType} onValueChange={setSelectedCaseType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo de caso" />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateCase}
                    disabled={!selectedCaseType}
                    className="bg-[#182A76] hover:bg-[#182A76]/90"
                  >
                    Crear Caso
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                <Link href={item.url} className="flex items-center gap-2 w-full">
                  {item.icon && <item.icon className="!size-5" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
