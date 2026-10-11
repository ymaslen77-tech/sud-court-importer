import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: { default: 'Суды России — информационный портал', template: '%s | Суды России' }, description: 'Проверенные сведения о судах Российской Федерации, контактах и подсудности.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="ru"><body><header><a href="/">Суды России</a></header><main>{children}</main><footer>Независимый информационный проект. Сведения требуют проверки по официальным источникам.</footer></body></html>;
}
