import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout({ title, subtitle, actions, children }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
