"use client";

import { Users, Stethoscope, Calendar, Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const stats = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Total Users",
    value: "1,234",
    change: "+12%",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: <Stethoscope className="h-6 w-6" />,
    title: "Active Doctors",
    value: "89",
    change: "+5%",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Appointments Today",
    value: "156",
    change: "+8%",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: <Activity className="h-6 w-6" />,
    title: "Platform Activity",
    value: "98%",
    change: "+2%",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <p className="text-zinc-600">Platform overview and management.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                    <span className="text-sm text-emerald-600 font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900">Recent Users</h2>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-zinc-500">
              <p>No recent users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900">Pending Verifications</h2>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-zinc-500">
              <p>No pending verifications</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
