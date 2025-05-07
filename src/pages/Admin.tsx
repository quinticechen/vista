
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  checkAdminStatus, 
  fetchEmbeddingJobs, 
  getEmbeddingJob, 
  createEmbeddingJob, 
  startEmbeddingProcess,
  type EmbeddingJob 
} from "@/services/adminService";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<EmbeddingJob | null>(null);
  const [previousJobs, setPreviousJobs] = useState<EmbeddingJob[]>([]);

  // Check if current user is admin
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        toast.error("Please sign in to access the admin page");
        return;
      }
      
      const isUserAdmin = await checkAdminStatus(session.user.id);
      
      if (!isUserAdmin) {
        navigate('/');
        toast.error("You don't have permission to access this page");
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(true);
      await refreshJobHistory();
    };
    
    checkAccess();
  }, [navigate]);

  // Refresh job history
  const refreshJobHistory = async () => {
    const jobs = await fetchEmbeddingJobs();
    
    // Check for any processing jobs
    const processingJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
    if (processingJobs.length > 0) {
      setCurrentJob(processingJobs[0]);
      setPreviousJobs(jobs.filter(job => job.id !== processingJobs[0].id));
      
      // Set up polling for the current job
      const intervalId = setInterval(() => {
        pollJobStatus(processingJobs[0].id);
      }, 5000);
      
      return () => clearInterval(intervalId);
    } else {
      setPreviousJobs(jobs);
      setCurrentJob(null);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    const jobData = await getEmbeddingJob(jobId);
    
    if (!jobData) {
      toast.error("Failed to poll job status");
      return;
    }
    
    setCurrentJob(jobData);
    
    if (jobData.status === 'completed' || jobData.status === 'error') {
      await refreshJobHistory();
    }
  };

  // Start embedding process
  const startEmbedding = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create a new job
      const jobData = await createEmbeddingJob(user.id);
      
      if (!jobData) {
        throw new Error("Failed to create job");
      }
      
      setCurrentJob(jobData);
      
      // Call the edge function to start the embedding process
      const success = await startEmbeddingProcess(jobData.id);
      
      if (!success) {
        throw new Error("Failed to start embedding process");
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
