import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type GiveawayEntry = {
  id: number;
  email: string;
  receiptImage: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
};

export default function GiveawayEntriesPage() {
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('/api/admin/giveaway-entries');

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setLocation('/auth');
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
  }, [setLocation]);

  const handleExportCSV = () => {
    if (!entries.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    // Add headers
    csvContent += "ID,Email,Status,Submitted At\n";
    
    // Add rows
    entries.forEach(entry => {
      csvContent += `${entry.id},${entry.email},${entry.status},${new Date(entry.submittedAt).toLocaleString()}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `giveaway-entries-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewImage = (imagePath: string) => {
    setSelectedImage(imagePath);
  };

  return (
    <Container className="py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Giveaway Entries</CardTitle>
            <p className="text-sm text-muted-foreground">
              View and manage all giveaway entries.
            </p>
          </div>
          <div className="flex flex-row gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/admin')}
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
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.id}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                          entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(entry.submittedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleViewImage(`/uploads/${entry.receiptImage}`)}
                            >
                              <Eye className="h-4 w-4" /> View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Receipt Image</DialogTitle>
                            </DialogHeader>
                            {selectedImage && (
                              <div className="mt-4">
                                <img 
                                  src={selectedImage} 
                                  alt="Receipt" 
                                  className="max-w-full rounded-lg"
                                />
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
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
