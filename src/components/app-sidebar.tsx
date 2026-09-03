"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconDashboard,
  IconFolder,
  IconHome,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { clearSession, getSession } from "@/lib/auth"

const navMain = [
  {
    title: "Panel de control",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Casos",
    url: "/cases",
    icon: IconFolder,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const session = getSession()

  const user = {
    name: session?.user.fullName || session?.user.email || "Usuario",
    email: session?.user.email || "",
    avatar: "/avatars/shadcn.jpg",
  }

  const handleLogout = () => {
    clearSession()
    router.push("/")
    router.refresh()
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconHome className="!size-5" />
                <span className="text-base font-semibold">BTL Legal Group.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={handleLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
