import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta, FulfillmentStatus } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface PharmacyListItem {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  verified: boolean;
  openingHours: Record<string, unknown> | null;
  medicineCount: number;
}

export interface PharmacyDetail extends PharmacyListItem {
  licenseNumber: string;
  createdAt: string;
}

export interface PharmacyMedicineItem {
  id: string;
  medicine: {
    id: string;
    name: string;
    genericName: string | null;
    category: string;
    description: string | null;
    dosageForms: string[];
  };
  price: number;
  stock?: number;
  availability?: string;
  minimumStock?: number;
  inStock?: boolean;
  isLowStock?: boolean;
}

export interface InventoryItem {
  id: string;
  medicine: {
    id: string;
    name: string;
    genericName: string | null;
    category: string;
    manufacturer: string | null;
    dosageForms: string[];
  };
  stock: number;
  price: number;
  minimumStock: number;
  inStock: boolean;
  isLowStock: boolean;
}

export interface FulfillmentListItem {
  id: string;
  status: FulfillmentStatus;
  rejectReason: string | null;
  pharmacy?: { id: string; name: string; address?: string; phone?: string } | null;
  patient?: { id: string; name: string; phone: string | null } | null;
  prescription?: { id: string; diagnosis: string; createdAt: string } | null;
  itemCount: number;
  fulfilledCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentDetail extends FulfillmentListItem {
  patient: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  prescription: {
    id: string;
    diagnosis: string;
    notes: string | null;
    status: string;
    validUntil: string | null;
    createdAt: string;
    doctor: { firstName: string; lastName: string };
    items: {
      id: string;
      medicineId: string;
      medicineName: string;
      medicineGenericName: string | null;
      medicineCategory: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string | null;
      inStock: boolean;
      stock: number;
      price: number | null;
    }[];
  };
  items: {
    id: string;
    medicineName: string;
    dosage: string;
    quantity: number;
    fulfilled: boolean;
    pharmacyMedicineId: string | null;
  }[];
}

// =============================================================================
// Pharmacy API
// =============================================================================

export const pharmacyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Public: Pharmacy Discovery ---
    getPharmacies: builder.query<
      { data: PharmacyListItem[]; meta: PaginationMeta },
      { search?: string; verified?: boolean; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set("search", params.search);
        if (params.verified) sp.set("verified", "true");
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/pharmacies${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Medicine"],
    }),

    getPharmacyById: builder.query<ApiResponse<PharmacyDetail>, string>({
      query: (pharmacyId) => `/pharmacies/${pharmacyId}`,
      providesTags: (_result, _error, id) => [{ type: "Medicine", id: `pharmacy-${id}` }],
    }),

    getPharmacyInventory: builder.query<
      { data: PharmacyMedicineItem[]; meta: PaginationMeta },
      { pharmacyId: string; search?: string; page?: number; limit?: number }
    >({
      query: ({ pharmacyId, ...params }) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set("search", params.search);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/pharmacies/${pharmacyId}/inventory${qs ? `?${qs}` : ""}`;
      },
      providesTags: (_result, _error, { pharmacyId }) => [
        { type: "Medicine", id: `inventory-${pharmacyId}` },
      ],
    }),

    // --- Pharmacy Staff: Inventory Management ---
    getMyInventory: builder.query<
      { data: InventoryItem[]; meta: PaginationMeta },
      { search?: string; lowStock?: boolean; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set("search", params.search);
        if (params.lowStock) sp.set("lowStock", "true");
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/pharmacy/inventory${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Medicine"],
    }),

    addInventoryItem: builder.mutation<
      ApiResponse<InventoryItem>,
      { medicineId: string; stock: number; price: number; minimumStock?: number }
    >({
      query: (data) => ({ url: "/pharmacy/inventory", method: "POST", body: data }),
      invalidatesTags: ["Medicine"],
    }),

    updateInventoryItem: builder.mutation<
      ApiResponse<InventoryItem & { transaction?: unknown }>,
      { inventoryId: string; stock?: number; price?: number; minimumStock?: number; inStock?: boolean }
    >({
      query: ({ inventoryId, ...data }) => ({
        url: `/pharmacy/inventory/${inventoryId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Medicine"],
    }),

    adjustStock: builder.mutation<
      ApiResponse<InventoryItem & { transaction: unknown }>,
      { inventoryId: string; quantity: number; type: string; reason?: string }
    >({
      query: ({ inventoryId, ...data }) => ({
        url: `/pharmacy/inventory/${inventoryId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Medicine"],
    }),

    removeInventoryItem: builder.mutation<ApiResponse<{ deleted: boolean }>, string>({
      query: (inventoryId) => ({
        url: `/pharmacy/inventory/${inventoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Medicine"],
    }),

    // --- Pharmacy Staff: Fulfillment Queue ---
    getPharmacyFulfillments: builder.query<
      { data: FulfillmentListItem[]; meta: PaginationMeta },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.status) sp.set("status", params.status);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/pharmacy/prescriptions${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Prescription"],
    }),

    getPharmacyFulfillmentDetail: builder.query<ApiResponse<FulfillmentDetail>, string>({
      query: (fulfillmentId) => `/pharmacy/prescriptions/${fulfillmentId}`,
      providesTags: (_result, _error, id) => [{ type: "Prescription", id: `fulfillment-${id}` }],
    }),

    updateFulfillmentStatus: builder.mutation<
      ApiResponse<{ id: string; status: string; updatedAt: string }>,
      { fulfillmentId: string; status: string; rejectReason?: string }
    >({
      query: ({ fulfillmentId, ...data }) => ({
        url: `/prescription-fulfillments/${fulfillmentId}/status`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Prescription", "Appointment"],
    }),

    // --- Patient: Submit for Fulfillment ---
    createFulfillment: builder.mutation<
      ApiResponse<{ id: string; pharmacy: { id: string; name: string }; status: string }>,
      { prescriptionId: string; pharmacyId: string }
    >({
      query: (data) => ({ url: "/prescription-fulfillments", method: "POST", body: data }),
      invalidatesTags: ["Prescription"],
    }),

    getPatientFulfillments: builder.query<
      { data: FulfillmentListItem[]; meta: PaginationMeta },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.status) sp.set("status", params.status);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/patient/fulfillments${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Prescription"],
    }),
  }),
});

export const {
  useGetPharmaciesQuery,
  useGetPharmacyByIdQuery,
  useGetPharmacyInventoryQuery,
  useGetMyInventoryQuery,
  useAddInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useAdjustStockMutation,
  useRemoveInventoryItemMutation,
  useGetPharmacyFulfillmentsQuery,
  useGetPharmacyFulfillmentDetailQuery,
  useUpdateFulfillmentStatusMutation,
  useCreateFulfillmentMutation,
  useGetPatientFulfillmentsQuery,
} = pharmacyApi;
