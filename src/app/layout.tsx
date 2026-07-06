import React from 'react';
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '../context/ThemeContext'
import './globals.css'
import '../App.css'

export const metadata = {
  title: 'ThinkRoom AI',
  description: 'AI Workspace and Chat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
