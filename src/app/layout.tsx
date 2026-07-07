import React from 'react';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { auth0 } from '../lib/auth0';
import { ThemeProvider } from '../context/ThemeContext'
import './globals.css'
import '../App.css'

export const metadata = {
  title: 'ThinkRoom AI',
  description: 'AI Workspace and Chat',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth0.getSession();

  return (
    <html lang="en">
      <body>
        <Auth0Provider user={session?.user}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  )
}
