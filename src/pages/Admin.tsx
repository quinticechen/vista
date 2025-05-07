
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Define types to match our database structure
interface Profile {
  id: string;
  is_admin: boolean;
}

interface EmbeddingJob {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  total_items: number;
  error: string | null;
  created_by: string;
  updated_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<EmbeddingJob | null>(null);
  const [previousJobs, setPreviousJobs] = useState<EmbeddingJob[]>([]);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        toast.error("Please sign in to access the admin page");
        return;
      }
      
      // Use type assertion to handle the new profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single() as unknown as { data: Profile | null, error: Error | null };
      
      if (error || !data || !data.is_admin) {
        navigate('/');
        toast.error("You don't have permission to access this page");
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(true);
      fetchJobHistory();
    };
    
    checkAdminStatus();
  }, [navigate]);

  // Fetch job history
  const fetchJobHistory = async () => {
    // Use type assertion to handle the new embedding_jobs table
    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10) as unknown as { data: EmbeddingJob[], error: Error | null };
    
    if (error) {
      toast.error("Failed to fetch job history");
      return;
    }
    
    // Check for any processing jobs
    const processingJobs = data.filter(job => job.status === 'processing' || job.status === 'pending');
    if (processingJobs.length > 0) {
      setCurrentJob(processingJobs[0]);
      setPreviousJobs(data.filter(job => job.id !== processingJobs[0].id));
      
      // Set up polling for the current job
      const intervalId = setInterval(() => {
        pollJobStatus(processingJobs[0].id);
      }, 5000);
      
      return () => clearInterval(intervalId);
    } else {
      setPreviousJobs(data);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    // Use type assertion to handle the new embedding_jobs table
    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('*')
      .eq('id', jobId)
      .single() as unknown as { data: EmbeddingJob, error: Error | null };
    
    if (error) {
      toast.error("Failed to poll job status");
      return;
    }
    
    setCurrentJob(data);
    
    if (data.status === 'completed' || data.status === 'error') {
      fetchJobHistory();
    }
  };

  // Start embedding process
  const startEmbedding = async () => {
    setIsLoading(true);
    try {
      // Create a new job
      // Use type assertion to handle the new embedding_jobs table
      const { data: jobData, error: jobError } = await supabase
        .from('embedding_jobs')
        .insert([{ status: 'pending', created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single() as unknown as { data: EmbeddingJob, error: Error | null };
      
      if (jobError || !jobData) {
        throw new Error(jobError?.message || "Failed to create job");
      }
      
      setCurrentJob(jobData);
      
      // Call the edge function to start the embedding process
      const response = await supabase.functions.invoke('generate-embeddings', {
        body: { jobId: jobData.id }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to start embedding process");
      }
      
      toast.success("Embedding process started");
      
      // Start polling for job status
      const intervalId = setInterval(() => {
        pollJobStatus(jobData.id);
      }, 5000);
      
      return () => clearInterval(intervalId);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isAdmin === null) {
    return <div className="container py-8">Loading...</div>;
  }

  if (isAdmin === false) {
    return null; // Will redirect
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Embedding</CardTitle>
            <CardDescription>
              Generate vector embeddings for all content items to enable AI-powered semantic search.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentJob && (currentJob.status === 'processing' || currentJob.status === 'pending') ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Embedding in progress...</span>
                  {getStatusBadge(currentJob.status)}
                </div>
                <Progress value={
                  currentJob.total_items > 0 
                    ? Math.round((currentJob.items_processed / currentJob.total_items) * 100) 
                    : 0
                } />
                <div className="text-sm text-muted-foreground">
                  {currentJob.items_processed} / {currentJob.total_items} items processed
                </div>
              </div>
            ) : (
              <p>Click the button below to start generating embeddings for all content items.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={startEmbedding} 
              disabled={isLoading || (currentJob && (currentJob.status === 'processing' || currentJob.status === 'pending'))}
            >
              {isLoading ? "Starting..." : "Generate Embeddings"}
            </Button>
          </CardFooter>
        </Card>
        
        {previousJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Job History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {previousJobs.map(job => (
                  <div key={job.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Job ID: {job.id.slice(0, 8)}...</div>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Started: {formatDate(job.started_at)}</div>
                      <div>Completed: {job.completed_at ? formatDate(job.completed_at) : "N/A"}</div>
                      <div>Items Processed: {job.items_processed} / {job.total_items}</div>
                      {job.error && (
                        <div className="col-span-2 text-red-500">
                          Error: {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
