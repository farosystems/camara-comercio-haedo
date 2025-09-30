"use client"

import { MembersTypesModule } from "@/components/modules/members-types-module"

export default function MembersTypesPage() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 md:p-6">
          <MembersTypesModule />
        </main>
      </div>
    </div>
  )
}