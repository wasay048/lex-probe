import { Metadata } from "next";
import { DemoRequestManagement } from "@/components/DemoRequestManagement";

export const metadata: Metadata = {
  title: "Demo Request Management | LexProbe Admin",
  description:
    "Manage demo requests and user approvals for the cartel detection platform.",
};

export default function AdminDemoRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Demo Request Management
        </h1>
        <p className="text-gray-600 mt-1">
          Review and manage demo requests from potential customers
        </p>
      </div>

      <DemoRequestManagement isAdmin={true} />
    </div>
  );
}
