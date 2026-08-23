"use client";

import { Settings, Heart, Shield, Database, Bell, Mail } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const systemInfo = [
  { label: "Platform", value: "Carely Healthcare Platform", icon: Heart },
  { label: "Environment", value: process.env.NODE_ENV || "development", icon: Settings },
  { label: "Version", value: "1.0.0", icon: Settings },
];

const featureStatus = [
  { name: "Authentication & RBAC", status: "active", icon: Shield },
  { name: "Patient Application", status: "active", icon: Heart },
  { name: "Doctor Application", status: "active", icon: Heart },
  { name: "Pharmacy Application", status: "active", icon: Heart },
  { name: "Appointment Scheduling", status: "active", icon: Settings },
  { name: "Consultations & Prescriptions", status: "active", icon: Settings },
  { name: "Pharmacy Fulfillment", status: "active", icon: Settings },
  { name: "Notifications", status: "active", icon: Bell },
  { name: "Email Service", status: "configured", icon: Mail },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  configured: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  disabled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Platform configuration and system information.</p>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">System Information</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {systemInfo.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Feature Status</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {featureStatus.map((feature) => (
            <div key={feature.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <feature.icon className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-900 dark:text-zinc-100">{feature.name}</span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[feature.status]}`}>
                {feature.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Database */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Database</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <Database className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">PostgreSQL</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Managed via Prisma ORM. Schema migrations required for changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
