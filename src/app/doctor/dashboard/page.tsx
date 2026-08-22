"use client";

import { Calendar, Users, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const stats = [
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Today's Appointments",
    value: "5",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Total Patients",
    value: "128",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Prescriptions Given",
    value: "45",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Hours This Week",
    value: "32",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function DoctorDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome, Dr. Smith</h1>
        <p className="text-zinc-600">Here&apos;s your practice overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900">Today&apos;s Schedule</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500">
            <p>No appointments scheduled for today</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
