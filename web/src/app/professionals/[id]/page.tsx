import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ProfessionalDetail from '@/components/ProfessionalDetail'

// Função para buscar dados no servidor (SSR)
async function getProfessional(id: string) {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { date: 'desc' },
          take: 10, // Últimos 10 eventos
        },
      },
    })

    if (!professional) {
      return null
    }

    return professional
  } catch (error) {
    console.error('Erro ao buscar profissional:', error)
    return null
  }
}

// Metadados dinâmicos
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const professional = await getProfessional(params.id)

  if (!professional) {
    return {
      title: 'Profissional não encontrado',
    }
  }

  return {
    title: `${professional.name} - ${professional.specialty} - Omni Saúde`,
    description: `Perfil profissional de ${professional.name}, especialista em ${professional.specialty}`,
  }
}

// Página com SSR
export default async function ProfessionalPage({ params }: { params: { id: string } }) {
  const professional = await getProfessional(params.id)

  if (!professional) {
    notFound()
  }

  return <ProfessionalDetail professional={professional} />
}

// Configuração de revalidação (ISR)
export const revalidate = 300 // Revalidar a cada 5 minutos