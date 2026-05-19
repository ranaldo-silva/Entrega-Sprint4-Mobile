// lib/whatsapp.ts
import { Linking, Platform } from 'react-native';

export function abrirWhatsApp(numero: string, mensagem: string) {
  if (!numero) {
    alert("Número de telefone não informado.");
    return;
  }

  const numLimpo = numero.replace(/\D/g, "");
  const numeroFinal = numLimpo.startsWith("55") ? numLimpo : `55${numLimpo}`;
  const msg = encodeURIComponent(mensagem || "Olá!");

  // No mobile usamos o app nativo do whatsapp se possível, ou o link universal
  const link = Platform.OS === 'web' 
    ? `https://wa.me/${numeroFinal}?text=${msg}`
    : `whatsapp://send?phone=${numeroFinal}&text=${msg}`;

  Linking.openURL(link).catch(() => {
    // Se o usuário não tiver o WhatsApp instalado no celular, abre o navegador como fallback
    const fallbackLink = `https://wa.me/${numeroFinal}?text=${msg}`;
    Linking.openURL(fallbackLink).catch((err) => {
      console.error("Falha ao abrir WhatsApp:", err);
      alert("Não foi possível abrir o WhatsApp.");
    });
  });
}
