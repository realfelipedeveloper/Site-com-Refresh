import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conecta Manager | Refresh",
  description: "Reconstrução do manager legado do Conecta em Next.js, NestJS e Prisma."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="bg-[#292929] text-[#a8a8a8]">
            <div className="mx-auto flex max-w-[1860px] items-center justify-center px-6 py-6 text-[14px]">
              © DNAnet - Inteligência na Web | Atualiza DXP - Gestão de Sistemas Web
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
