import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from '../components/feedback/Alert'
import { EmptyState } from '../components/feedback/EmptyState'
import { LoadingState } from '../components/feedback/LoadingState'
import { ModalConfirm } from '../components/feedback/ModalConfirm'
import { CandidatePreviewCard } from '../components/ui/CandidatePreviewCard'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { InputCPF } from '../components/ui/InputCPF'
import { MetricCard } from '../components/ui/MetricCard'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusBadge } from '../components/ui/StatusBadge'

describe('minimum design system', () => {
  it('renders its basic UI components with accessible labels', () => {
    render(
      <>
        <Button>Continuar</Button>
        <Card>Conteúdo</Card>
        <InputCPF />
        <PageHeader title="Título da página" />
        <StatusBadge tone="success">Ativo</StatusBadge>
        <MetricCard label="Eleitores" value="24" detail="Aptos" />
        <CandidatePreviewCard name="Ana Lima" role="Analista" phrase="Cuidar é participar" />
        <Alert tone="success">Tudo certo</Alert>
        <LoadingState />
        <EmptyState title="Sem dados" description="Ainda não há registros." />
        <ModalConfirm open title="Confirmar ação" description="Esta ação é visual." />
        <DataTable
          columns={[{ key: 'name', label: 'Nome', render: (row: { name: string }) => row.name }]}
          rows={[{ name: 'Ana Lima' }]}
          rowKey={(row) => row.name}
        />
      </>,
    )

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByLabelText('CPF do eleitor')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Título da página' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
