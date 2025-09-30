"use client"

import { MembersCategoriesModule } from "@/components/modules/members-categories-module"

export default function MembersCategoriesPage() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 md:p-6">
          <MembersCategoriesModule />
        </main>
      </div>
    </div>
  )
}