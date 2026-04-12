import { useState, useRef } from 'react'
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function LabelsPage({ token }) {
  const [file, setFile] = useState(null)
  const [paperModel, setPaperModel] = useState('A4249')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('info')
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setMessage('Por favor, selecione um arquivo CSV válido.')
        setMessageType('error')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setMessage(null)
    }
  }

  async function handleGeneratePdf(e) {
    e.preventDefault()

    if (!file) {
      setMessage('Por favor, selecione um arquivo CSV.')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('paperModel', paperModel)

      const response = await fetch(`${API_BASE_URL}/Labels/generate-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        throw new Error(errorData?.message || `Erro: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'etiquetas.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage('Etiquetas geradas com sucesso!')
      setMessageType('success')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setMessage(error.message || 'Erro ao gerar etiquetas')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-900 dark:shadow-black/30">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Gerador de Etiquetas
          </h1>
          <a
            href="/modelo-etiquetas.csv"
            download
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1e7e34] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#186429]"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar modelo CSV
          </a>
        </div>

        <form onSubmit={handleGeneratePdf} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Modelo de Papel
            </label>
            <select
              value={paperModel}
              onChange={(e) => setPaperModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
              disabled={isLoading}
            >
              <option value="A4249">Pimaco - A4249</option>
            </select>
          </div>

          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden"
              id="csv-input"
            />
            <label htmlFor="csv-input" className="cursor-pointer">
              <Upload className="mx-auto mb-2 h-10 w-10 text-gray-400" />
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Clique ou arraste um arquivo CSV aqui
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Arquivo CSV com colunas: referencia, nome, preço, quantidade
              </p>
            </label>
            {file && (
              <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">
                ✓ {file.name}
              </p>
            )}
          </div>

          {message && (
            <div
              className={`flex items-center gap-3 rounded-lg p-4 ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : messageType === 'error'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              {messageType === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Gerando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Download className="h-5 w-5" />
                Gerar Etiquetas
              </span>
            )}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-900 dark:shadow-black/30">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">
          Formato do CSV
        </h2>
        <div className="overflow-x-auto">
          <pre className="rounded bg-gray-100 p-4 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
{`referencia,nome,preço,quantidade
CA349022,Camisola Manga Simples,142.00,1
CA349023,Camisola Manga Comprida,165.50,2`}
          </pre>
        </div>
      </div>
    </div>
  )
}
