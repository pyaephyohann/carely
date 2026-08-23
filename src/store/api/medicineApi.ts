import { baseApi } from "./baseApi";
import type { PaginationMeta } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface Medicine {
  id: string;
  name: string;
  genericName: string | null;
  category: string;
  manufacturer: string | null;
  description: string | null;
  dosageForms: string[];
  requiresPrescription: boolean;
}

// =============================================================================
// Medicine API
// =============================================================================

export const medicineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchMedicines: builder.query<
      { data: Medicine[]; meta: PaginationMeta },
      { q?: string; category?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.q) sp.set("q", params.q);
        if (params.category) sp.set("category", params.category);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/medicines${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Medicine"],
    }),
  }),
});

export const { useSearchMedicinesQuery } = medicineApi;
