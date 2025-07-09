import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#005DA8]">
      <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden">
        <div className="bg-[#182A76] absolute w-[400px] h-[400px] rounded-full -left-[200px] -bottom-[200px]"></div>
        <div className="bg-[#6F5E52] absolute w-[300px] h-[300px] rounded-full -left-[150px] -bottom-[150px]"></div>
        <div className="bg-[#AA8E73] absolute w-[200px] h-[200px] rounded-full -left-[100px] -bottom-[100px]"></div>
      </div>
      <div className="w-full max-w-sm z-10">
        <LoginForm />
      </div>
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
        <div className="bg-[#182A76] absolute w-[400px] h-[400px] rounded-full -right-[200px] -top-[200px]"></div>
        <div className="bg-[#6F5E52] absolute w-[300px] h-[300px] rounded-full -right-[150px] -top-[150px]"></div>
        <div className="bg-[#AA8E73] absolute w-[200px] h-[200px] rounded-full -right-[100px] -top-[100px]"></div>
      </div>
    </div>
  )
}
