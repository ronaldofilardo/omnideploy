import React, { useEffect, useState } from 'react';
import AssociateNotificationModal from './AssociateNotificationModal';
import CreateEventFromNotificationModal from './CreateEventFromNotificationModal';

export interface Notification {
  id: string;
  type: string;
  payload: {
    doctorName: string;
    examDate: string;
    report: {
      fileName: string;
      fileContent: string;
    };
  };
  createdAt: string;
}

interface Professional {
  id: string;
  name: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [associateModal, setAssociateModal] = useState<{ open: boolean; notification: Notification | null }>({ open: false, notification: null });
  const [createModal, setCreateModal] = useState<{ open: boolean; notification: Notification | null }>({ open: false, notification: null });
  const [professionalId, setProfessionalId] = useState<string>('');

  // Buscar profissionais (pega o primeiro)
  useEffect(() => {
    fetch('/api/professionals')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setProfessionalId(data[0].id);
      });
  }, []);

  const fetchNotifications = () => {
    setLoading(true);
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar notificações');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500 text-lg">Carregando notificações...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500 text-lg">{error}</div>;
  if (notifications.length === 0) return <div className="flex items-center justify-center h-full text-gray-400 text-lg">Sem notificações pendentes.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-2">
      <h2 className="text-2xl font-bold mb-6 text-[#1E40AF]">Central de Notificações</h2>
      <ul className="space-y-6">
        {notifications.map((n) => (
          <li
            key={n.id}
            className="bg-white border border-gray-200 rounded-xl shadow-md p-6 flex flex-col gap-2"
          >
            <div className="text-base font-semibold text-[#10B981] mb-1 flex items-center gap-2">
              <span>📄 Laudo recebido:</span>
              <span className="text-gray-700 font-normal">{n.payload.report.fileName}</span>
            </div>
            <div className="text-sm text-gray-700"><strong>Médico:</strong> {n.payload.doctorName}</div>
            <div className="text-sm text-gray-700"><strong>Data do exame:</strong> {(() => {
              const d = n.payload.examDate;
              if (!d) return '';
              const [y, m, day] = d.split('-');
              return `${day}-${m}-${y}`;
            })()}</div>
            <div className="text-sm text-gray-500"><strong>Recebido em:</strong> {new Date(n.createdAt).toLocaleString()}</div>
            <div className="flex gap-3 mt-3">
              <button
                className="bg-[#1E40AF] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setAssociateModal({ open: true, notification: n })}
              >
                Associar a evento existente
              </button>
              <button
                className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setCreateModal({ open: true, notification: n })}
              >
                Criar novo evento
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Modal de associação */}
      <AssociateNotificationModal
        notification={associateModal.notification}
        open={associateModal.open}
        onClose={() => setAssociateModal({ open: false, notification: null })}
        onSuccess={fetchNotifications}
      />
      {/* Modal de criação */}
      {createModal.notification && (
        <CreateEventFromNotificationModal
          open={createModal.open}
          onClose={() => setCreateModal({ open: false, notification: null })}
          onSuccess={fetchNotifications}
          notification={createModal.notification}
          professionalId={professionalId}
        />
      )}
    </div>
  );
}
