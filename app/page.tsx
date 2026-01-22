"use client";

import { useState, useRef } from "react";
import "./styles.css";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função chamada quando o usuário clica em "Send File"
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Função chamada quando o usuário seleciona um arquivo
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      // Cria o formulário para enviar o arquivo
      const formData = new FormData();
      formData.append("file", file);

      // Envia para a nossa API criada no Passo 2
      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha no processamento");
      }

      // Converte a resposta em um "Blob" (arquivo) para download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Cria um link temporário e clica nele automaticamente para baixar
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.csv";
      document.body.appendChild(a);
      a.click();

      // Limpeza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao processar o arquivo.");
    } finally {
      setIsLoading(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="mainPage">
      <h1 className="mainPageTitle">Sizebay Armani Processor</h1>

      {/* Input invisível para selecionar arquivo */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {isLoading ? (
        // Simples feedback visual de Loading
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p className="loading-text">Processando arquivo... Aguarde.</p>
          {/* Você pode adicionar um spinner CSS aqui se quiser */}
        </div>
      ) : (
        <button className="sendFileButton" onClick={handleButtonClick}>
          Send File
        </button>
      )}
    </div>
  );
}
