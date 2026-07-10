import type { Metadata } from 'next';
import { Quicksand, Fredoka } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap'
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'CrunchyBowl 🍜 — Comida coreana en Pucón',
  description:
	'Bibimbap, Japchae y Pollo Frito Coreano hecho en casa. Delivery y retiro en Pucón.',
  icons: { icon: '/brand/logo.webp' }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
	<html lang="es" className={`${quicksand.variable} ${fredoka.variable}`}>
  	<body className="font-sans antialiased">
    	{children}
    	<Toaster
      	position="top-center"
      	toastOptions={{
        	style: {
          	borderRadius: '1rem',
          	border: '2px solid #FFB6C7',
          	background: '#FFF5F0',
          	color: '#4A2C3A'
        	}
      	}}
    	/>
  	</body>
	</html>
  );
}

