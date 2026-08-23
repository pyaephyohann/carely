"use client";

import { use } from "react";
import { AlertCircle, RefreshCw, ArrowLeft, CheckCircle, XCircle, MapPin, Phone, Mail, Users, Pill, FileText, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAdminPharmacyQuery, useUpdatePharmacyVerificationMutation } from "@/store/api/adminApi";
import Link from "next/link";

export default function AdminPharmacyDetailPage({ params }: { params: Promise<{ pharmacyId: string }> }) {
  const { pharmacyId } = use(params);
  const { data, isLoading, error, refetch } = useGetAdminPharmacyQuery(pharmacyId);
  const [updateVerification, { isLoading: isUpdating }] = useUpdatePharmacyVerificationMutation();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Pharmacy not found</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">Unable to load pharmacy details.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const pharmacy = data.data;

  const handleVerification = async (verified: boolean) => {
    try {
      await updateVerification({ pharmacyId: pharmacy.id, verified }).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/pharmacies"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Pharmacies
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{pharmacy.name}</h1>
            {pharmacy.verified ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Pending Verification
              </span>
            )}
            {!pharmacy.active && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Inactive
              </span>
            )}
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {pharmacy.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!pharmacy.verified ? (
            <Button onClick={() => handleVerification(true)} disabled={isUpdating}>
              <CheckCircle className="h-4 w-4 mr-2" /> Verify
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleVerification(false)}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <XCircle className="h-4 w-4 mr-2" /> Unverify
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <Users className="h-4 w-4" /> Staff
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{pharmacy.counts.staff}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <Pill className="h-4 w-4" /> Medicines
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{pharmacy.counts.medicines}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <FileText className="h-4 w-4" /> Fulfillments
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{pharmacy.counts.fulfillments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <Building2 className="h-4 w-4" /> License
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{pharmacy.licenseNumber}</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Contact Information</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {pharmacy.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{pharmacy.email}</p>
                </div>
              </div>
            )}
            {pharmacy.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Phone</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{pharmacy.phone}</p>
                </div>
              </div>
            )}
            {pharmacy.description && (
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Description</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">{pharmacy.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Registered</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {new Date(pharmacy.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Staff Members</h2>
          </CardHeader>
          <CardContent>
            {pharmacy.staff.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No staff members</p>
            ) : (
              <div className="space-y-2">
                {pharmacy.staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email} · {member.role}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.userStatus === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {member.userStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
