"use client";

import { Calendar, FileText, Clock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

const quickActions = [
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "Book Appointment",
    description: "Find and book a doctor",
    href: "/patient/doctors",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "View Prescriptions",
    description: "Check your prescriptions",
    href: "/patient/prescriptions",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Upcoming Appointments",
    description: "See your schedule",
    href: "/patient/appointments",
  },
];

export default function PatientDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back!</h1>
        <p className="text-zinc-600">Here&apos;s an overview of your health dashboard.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Upcoming</p>
                <p className="text-2xl font-bold text-zinc-900">2</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Prescriptions</p>
                <p className="text-2xl font-bold text-zinc-900">3</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Completed</p>
                <p className="text-2xl font-bold text-zinc-900">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Notifications</p>
                <p className="text-2xl font-bold text-zinc-900">5</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900">{action.title}</h3>
                    <p className="text-sm text-zinc-500">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900">Recent Activity</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500">
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
