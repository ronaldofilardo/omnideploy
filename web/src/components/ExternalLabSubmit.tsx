"use client";
import React, { useState } from 'react';

export default function ExternalLabSubmit() {
  const [patientEmail, setPatientEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    if (!patientEmail || !doctorName || !examDate || !file) {
      setError('Preencha todos os campos e selecione um arquivo.');
      setLoading(false);
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const payload = {
          patientEmail,
          doctorName,
          examDate,
          report: {
            fileName: file.name,
            fileContent: base64,
          },
        };
        const res = await fetch('/api/lab/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setSuccess('Documento enviado com sucesso!');
          setPatientEmail('');
          setDoctorName('');
          setExamDate('');
          setFile(null);
        } else {
          const data = await res.json();
          setError(data.error || 'Erro ao enviar documento.');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError('Erro ao processar arquivo.');
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-32 bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 flex flex-col gap-4"
    >
      <h2 className="text-xl font-bold text-center text-[#1E40AF] mb-1">Portal de Envio Externo</h2>
      <p className="text-center text-gray-500 mb-4">Omni Saúde - Envio de Documentos para Exames</p>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-700 font-medium">E-mail do Paciente</label>
        <input
          type="email"
          placeholder="E-mail do Paciente"
          value={patientEmail}
          onChange={e => setPatientEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-700 font-medium">Médico Solicitante</label>
        <input
          type="text"
          placeholder="Médico Solicitante"
          value={doctorName}
          onChange={e => setDoctorName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-700 font-medium">Data do Exame</label>
        <input
          type="date"
          placeholder="dd/mm/aaaa"
          value={examDate}
          onChange={e => setExamDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          required
        />
      </div>
      <div className="border border-dashed border-[#10B981] rounded-lg p-6 text-center mb-2 bg-gray-50">
        <label htmlFor="file-upload" className="cursor-pointer text-[#10B981] font-semibold block">
          {file ? `Arquivo selecionado: ${file.name}` : 'Clique para selecionar Laudo/Resultado'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-lg py-3 font-semibold text-base transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Enviando...' : 'Enviar Documento'}
      </button>
      {success && <div className="text-green-600 mt-2 text-center font-medium">{success}</div>}
      {error && <div className="text-red-600 mt-2 text-center font-medium">{error}</div>}
    </form>
  );
}
