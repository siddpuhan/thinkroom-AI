import React from 'react';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
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
    <html lang="en">
      <body>
        <Auth0Provider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  )
}
