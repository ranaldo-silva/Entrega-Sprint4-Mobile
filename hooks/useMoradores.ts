import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMoradores,
  saveMoradores,
  updateMorador,
  deleteMorador,
  Morador,
} from "../lib/storage";

export function useMoradores() {
  return useQuery({
    queryKey: ["moradores"],
    queryFn: getMoradores,
  });
}

export function useCreateMorador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (morador: Morador) => saveMoradores(morador),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moradores"] });
    },
  });
}

export function useUpdateMorador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, morador }: { id: string | number; morador: Partial<Morador> }) =>
      updateMorador(id, morador),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moradores"] });
    },
  });
}

export function useDeleteMorador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteMorador(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moradores"] });
    },
  });
}
