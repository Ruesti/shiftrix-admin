import './globals.css'
import type { Metadata } from 'next'


export const metadata: Metadata = {
title: 'Shiftrix Admin',
description: 'Adminoberfläche für Shiftrix',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="de">
<body>
{children}
</body>
</html>
)
}