import { apiFetch } from "../services/api";

// --------------------
// Tipos
// --------------------
export interface Morador {
  id?: number;
  nome: string;
  sobrenome: string;
  bloco: string;
  apartamento: string;
  telefone: string;
  email?: string;
}

export interface Encomenda {
  id?: number;
  token?: string;
  origem?: string;
  retirada?: boolean;
  retiradaEm?: string;
  dataRecebimento?: string;
  dataRegistro?: string;
  descricao?: string;
  moradorId?: number;
  morador?: Morador | null;
}

// --------------------
// Moradores
// --------------------
export async function getMoradores(): Promise<Morador[]> {
  const res = await apiFetch("/moradores");
  if (!res.ok) {
    throw new Error(`Acesso negado ou erro no servidor (Status: ${res.status}). Verifique se seu usuário existe no banco de dados da Azure.`);
  }
  
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = []; // Fallback se retornar vazio
  }
  
  return data.map((m: any) => {
    // Tenta separar o nome completo caso tenha vindo agrupado do backend
    const nomes = (m.nome || "").split(" ");
    const primeiroNome = nomes[0] || "";
    const sobrenome = nomes.slice(1).join(" ") || "";

    return {
      id: m.id || m.idMorador,
      nome: primeiroNome,
      sobrenome: sobrenome,
      bloco: m.bloco || "",
      apartamento: m.apartamento || "",
      telefone: m.telefone || "",
      email: m.email || "",
    };
  });
}

export async function saveMoradores(morador: Morador): Promise<Morador> {
  const payload = {
    nome: `${morador.nome} ${morador.sobrenome}`.trim(),
    telefone: morador.telefone,
    email: morador.email || "morador@condominio.app",
    // Tenta enviar o número do apartamento como ID para satisfazer a foreign key do banco de dados Java
    apartamentoId: parseInt(morador.apartamento) || 1
  };

  const res = await apiFetch("/moradores", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("A API recusou o cadastro do morador. Verifique integridade de apartamento/email.");
  }
  return await res.json();
}

export async function updateMorador(
  id: string | number,
  morador: Partial<Morador>
): Promise<Morador> {
  try {
    const payload = {
      nome: morador.nome && morador.sobrenome ? `${morador.nome} ${morador.sobrenome}`.trim() : morador.nome,
      telefone: morador.telefone,
      email: morador.email || "morador@condominio.app",
      apartamentoId: morador.apartamento ? parseInt(morador.apartamento) : 1
    };

    const res = await apiFetch(`/moradores/${Number(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      const msg =
        (data && data.message) ||
        (await res.text()) ||
        "Erro ao atualizar morador";
      throw new Error(msg);
    }

    return data || morador;
  } catch (err) {
    console.error("updateMorador error:", err);
    throw err;
  }
}

export async function deleteMorador(id: string | number): Promise<void> {
  await apiFetch(`/moradores/${Number(id)}`, {
    method: "DELETE",
  });
}

// --------------------
// Encomendas
// --------------------
export async function getEncomendas(): Promise<Encomenda[]> {
  const res = await apiFetch("/encomendas");
  if (!res.ok) {
    throw new Error(`Acesso negado ou erro no servidor (Status: ${res.status}).`);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = [];
  }

  return data.map((e: any) => ({
    id: e.id,
    token: e.tokenEncomenda ?? e.token ?? "—",
    origem: e.origem ?? "—",
    retirada: e.foiRetirada ?? e.retirada ?? false,
    retiradaEm: e.retiradaEm ?? null,
    dataRecebimento: e.dataRecebida ?? e.dataRecebimento ?? null,
    descricao: e.descricao ?? "",
    morador: e.morador ?? null,
  }));
}

// Salvar encomenda
export async function saveEncomendas(encomenda: Partial<Encomenda>): Promise<Encomenda> {
  const res = await apiFetch("/encomendas", {
    method: "POST",
    body: JSON.stringify(encomenda),
  });

  if (!res.ok) {
    const msg = (await res.text()) || "Erro ao salvar encomenda";
    throw new Error(msg);
  }

  return await res.json();
}

// Atualizar encomenda
export async function updateEncomenda(
  id: string | number,
  encomenda: Partial<Encomenda>
): Promise<Encomenda> {
  const res = await apiFetch(`/encomendas/${Number(id)}`, {
    method: "PUT",
    body: JSON.stringify(encomenda),
  });

  if (!res.ok) {
    const msg = (await res.text()) || "Erro ao atualizar encomenda";
    throw new Error(msg);
  }

  return await res.json();
}

// ✅ NOVA: buscar encomenda por ID
export async function getEncomendaById(id: string | number): Promise<Encomenda> {
  const res = await apiFetch("/encomendas");
  const data = await res.json();
  return data.find((e: any) => e.id === Number(id));
}

// ✅ Já existente
export async function deleteEncomenda(id: string | number): Promise<void> {
  await apiFetch(`/encomendas/${Number(id)}`, {
    method: "DELETE",
  });
}


export async function confirmarRetirada(token: string): Promise<void> {
  const encomendaRes = await apiFetch(`/encomendas/token/${token}`);
  if (!encomendaRes.ok) throw new Error("Token inválido ou encomenda não encontrada.");

  const encomenda = await encomendaRes.json();

  const retirada = {
    morador: encomenda.morador
      ? `${encomenda.morador.nome} ${encomenda.morador.sobrenome || ""}`.trim()
      : "Desconhecido",
    encomenda: encomenda.tokenEncomenda || encomenda.token,
  };

  const res = await apiFetch("/retiradas", {
    method: "POST",
    body: JSON.stringify(retirada),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erro ao registrar retirada");
  }

  console.log("✅ Retirada registrada com sucesso!");
}
