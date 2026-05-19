import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEncomendas,
  saveEncomendas,
  updateEncomenda,
  deleteEncomenda,
  confirmarRetirada,
  Encomenda,
} from "../lib/storage";

export function useEncomendas() {
  return useQuery({
    queryKey: ["encomendas"],
    queryFn: getEncomendas,
  });
}

export function useCreateEncomenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (encomenda: Partial<Encomenda>) => saveEncomendas(encomenda),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encomendas"] });
    },
  });
}

export function useUpdateEncomenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, encomenda }: { id: string | number; encomenda: Partial<Encomenda> }) =>
      updateEncomenda(id, encomenda),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encomendas"] });
    },
  });
}

export function useDeleteEncomenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteEncomenda(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encomendas"] });
    },
  });
}

export function useConfirmarRetirada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => confirmarRetirada(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encomendas"] });
    },
  });
}
