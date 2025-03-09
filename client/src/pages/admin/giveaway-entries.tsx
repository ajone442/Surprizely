import React, { useEffect, useState } from "react";
import { useNavigate } from "wouter";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Gift, ArrowLeft, Download } from "lucide-react";

type GiveawayEntry = {
  id: number;
  email: string;
  orderID: string;
  createdAt: string;
  ipAddress?: string;
  productLink?: string;
  emailSent: boolean;
};

export default function GiveawayEntriesPage() {
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('/api/admin/giveaway-entries');

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/auth');
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setEntries(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch giveaway entries');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [navigate]);

  const handleExportCSV = () => {
    if (!entries.length) return;

    // Create CSV content
    const headers = ["ID", "Email", "Order ID", "Date", "Email Sent"];
    const csvRows = [
      headers.join(","),
      ...entries.map(entry => [
        entry.id,
        entry.email,
        entry.orderID,
        new Date(entry.createdAt).toLocaleString(),
        entry.emailSent ? "Yes" : "No"
      ].join(","))
    ];
    const csvContent = csvRows.join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `giveaway-entries-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container className="py-12">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gift className="h-6 w-6 text-primary" />
            <CardTitle>Giveaway Entries</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <Button 
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1"
              disabled={entries.length === 0}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading && <p className="text-center py-4">Loading entries...</p>}

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No giveaway entries found.</p>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  Total of {entries.length} giveaway entries
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Email Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.id}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.orderID}</TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{entry.emailSent ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}