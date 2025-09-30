"use client"

import { MembersListModule } from "@/components/modules/members-list-module"

export default function MembersListPage() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 md:p-6">
          <MembersListModule />
        </main>
      </div>
    </div>
  )
}