import { FileText, FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: 'file' | 'folder'
}

export default function EmptyState({ title, description, icon = 'file' }: EmptyStateProps) {
  const Icon = icon === 'file' ? FileText : FolderOpen
  
  return (
    <div className="text-center py-16 px-4">
      <Icon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}