import { Calendar, Clock, FileText, LogOut, Users, X } from 'lucide-react'

interface SidebarProps {
  activeMenu: string
  onMenuClick: (menu: string) => void
  onClose?: () => void
}

export function Sidebar({ activeMenu, onMenuClick, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'professionals', label: 'Profissionais', icon: Users },
    { id: 'repositorio', label: 'Repositório', icon: FileText },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
  ]

  return (
    <div className="w-[280px] h-screen bg-white border-r border-[#E5E7EB] flex flex-col relative">
      {/* Close Button for Mobile */}
      {onClose && (
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      )}

      {/* Header */}
      <div className="pt-8 pb-10 px-6">
        <h1 className="text-[#1E40AF] mb-1">OmniSaúde</h1>
        <p className="text-[#6B7280]">Tudo em suas mãos</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4">
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id

            return (
              <button
                key={item.id}
                onClick={() => onMenuClick(item.id)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${
                    isActive
                      ? 'bg-[#10B981] text-white'
                      : 'text-[#374151] hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-[16px]">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-4 pb-6">
        <button
          onClick={() => onMenuClick('logout')}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#EF4444] hover:bg-red-50 transition-all w-full"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="text-[16px]">Sair</span>
        </button>
      </div>
    </div>
  )
}
