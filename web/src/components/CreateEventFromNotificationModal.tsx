import React, { useState } from 'react';

interface CreateEventFromNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification: {
    id: string;
    payload: {
      doctorName: string;
      examDate: string;
      report: {
        fileName: string;
        fileContent: string;
      };
    };
  };
  professionalId: string;
}

export default function CreateEventFromNotificationModal({ open, onClose, onSuccess, notification, professionalId }: CreateEventFromNotificationModalProps) {
  const [title, setTitle] = useState('Laudo: ' + notification.payload.report.fileName);
  const [description, setDescription] = useState('Laudo recebido de ' + notification.payload.doctorName);
  const [date, setDate] = useState(notification.payload.examDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          date,
          startTime,
          endTime,
          type: 'EXAME',
          professionalId,
          files: [{
            slot: 'result',
            name: notification.payload.report.fileName,
            url: 'uploads/' + notification.payload.report.fileName
          }],
          notificationId: notification.id
        })
      });
      if (!res.ok) throw new Error('Erro ao criar evento.');
      onSuccess();
      onClose();
    } catch (e) {
      setError('Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 min-w-[360px] max-w-full p-8 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-[#1E40AF] mb-2">Criar Novo Evento a partir do Laudo</h3>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="flex flex-col gap-2 mb-2">
          <label className="text-sm text-gray-700 font-medium">Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
        </div>
        <div className="flex flex-col gap-2 mb-2">
          <label className="text-sm text-gray-700 font-medium">Descrição</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
        </div>
        <div className="flex flex-col gap-2 mb-2">
          <label className="text-sm text-gray-700 font-medium">Data do exame</label>
          <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
        </div>
        <div className="flex gap-4 mb-2">
          <div className="flex flex-col flex-1">
            <label className="text-sm text-gray-700 font-medium">Início</label>
            <input value={startTime} onChange={e => setStartTime(e.target.value)} type="time" className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm text-gray-700 font-medium">Fim</label>
            <input value={endTime} onChange={e => setEndTime(e.target.value)} type="time" className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button
            onClick={handleCreate}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#10B981] hover:bg-[#059669]'}`}
          >
            Criar Evento
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
