import React, { useEffect, useState } from 'react';
import type { Notification } from './NotificationCenter';

interface Professional {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  professionalId: string;
  files?: { slot: string; name: string; url: string }[];
}

interface AssociateNotificationModalProps {
  notification: Notification | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function AssociateNotificationModal({ notification, open, onClose, onSuccess, userId }: AssociateNotificationModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  useEffect(() => {
    if (open) {
      fetch('/api/professionals')
        .then(res => res.json())
        .then(data => setProfessionals(Array.isArray(data) ? data : []));
    }
  }, [open]);

  useEffect(() => {
    if (open && userId) {
      fetch(`/api/events?userId=${encodeURIComponent(userId)}`)
        .then(res => res.json())
        .then(data => setEvents(Array.isArray(data) ? data : []))
        .catch(() => setError('Erro ao buscar eventos.'));
    }
  }, [open, userId]);

  const handleAssociate = async () => {
    if (!selectedEvent || !notification) return;
    setLoading(true);
    setError(null);
    try {
      const event = events.find(ev => ev.id === selectedEvent);
      if (!event) throw new Error('Evento não encontrado.');
      // Adiciona o arquivo do laudo ao slot correto (result/Laudo/Resultado)
      const newFile = {
        slot: 'result',
        name: notification.payload.report.fileName,
        url: 'uploads/' + notification.payload.report.fileName
      };
      // Remove duplicatas do mesmo slot
      const files = [
        ...(event.files?.filter(f => f.slot !== 'result') || []),
        newFile
      ];
      const payload = {
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type,
        startTime: event.startTime,
        endTime: event.endTime,
        professionalId: event.professionalId,
        files,
        notificationId: notification.id
      };
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao associar notificação.');
      onSuccess();
      onClose();
    } catch (e) {
      setError('Erro ao associar notificação.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 min-w-[340px] max-w-full p-8 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-[#1E40AF] mb-2">Associar a Evento Existente</h3>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <select
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
        >
          <option value="">Selecione um evento</option>
          {events.map(ev => {
            // Formatar data para dd/mm/aaaa
            let dataFormatada = ev.date;
            if (ev.date && ev.date.includes('-')) {
              const [y, m, d] = ev.date.split('-');
              dataFormatada = `${d}/${m}/${y}`;
            }
            // Tipo amigável
            let tipo = ev.type === 'CONSULTATION' ? 'CONSULTA' : ev.type === 'EXAM' ? 'EXAME' : ev.type === 'PROCEDURE' ? 'PROCEDIMENTO' : ev.type === 'MEDICATION' ? 'MEDICAÇÃO' : ev.type;
            // Nome do profissional
            const prof = professionals.find(p => p.id === ev.professionalId);
            const profName = prof ? prof.name : '';
            return (
              <option key={ev.id} value={ev.id}>
                {tipo}{profName ? ` - ${profName}` : ''} - {dataFormatada} {ev.startTime}{ev.endTime ? `-${ev.endTime}` : ''}
              </option>
            );
          })}
        </select>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleAssociate}
            disabled={loading || !selectedEvent}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${loading || !selectedEvent ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1E40AF] hover:bg-[#2563EB]'}`}
          >
            Associar
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
