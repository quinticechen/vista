import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  checkAdminStatus, 
  fetchEmbeddingJobs, 
  getEmbeddingJob, 
  createEmbeddingJob, 
  startEmbeddingProcess,
  type EmbeddingJob 
} from "@/services/adminService";
import WebhookDebugger from "@/components/WebhookDebugger";

const Embedding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<EmbeddingJob | null>(null);
  const [previousJobs, setPreviousJobs] = useState<EmbeddingJob[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Initialize and check for active jobs
  useEffect(() => {
    refreshJobHistory();
  }, []);

  // Refresh job history
  const refreshJobHistory = async () => {
    const jobs = await fetchEmbeddingJobs();
    setLastUpdated(new Date().toLocaleString());
    
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
    
    if (jobData.status === 'completed' || jobData.status === 'error' || jobData.status === 'partial_success') {
      if (jobData.status === 'error') {
        toast.error(`Embedding process failed: ${jobData.error || 'Unknown error'}`);
      } else if (jobData.status === 'partial_success') {
        toast.warning(`Embedding process completed with some errors: ${jobData.error}`);
      } else {
        toast.success("Embedding process completed successfully");
      }
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
      await refreshJobHistory(); // Refresh to get accurate state
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
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
      case 'partial_success':
        return <Badge className="bg-orange-500">Partial Success</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get the date of the last successful embedding
  const getLastSuccessfulEmbedding = () => {
    const completedJobs = previousJobs.filter(job => job.status === 'completed');
    if (completedJobs.length === 0) return "No previous completed jobs";
    
    const lastSuccessful = completedJobs[0]; // Jobs are already sorted by date desc
    return formatDate(lastSuccessful.completed_at || lastSuccessful.started_at);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Embedding Management</h1>
        <p className="text-muted-foreground">
          Generate and manage embeddings for your content to enable AI-powered search
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job History</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="debug">Webhook Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Content Embeddings</CardTitle>
              <CardDescription>
                Generate vector embeddings for your content items to enable AI-powered semantic search.
                {previousJobs.some(job => job.status === 'completed') && (
                  <p className="mt-2">
                    <strong>Last successful embedding:</strong> {getLastSuccessfulEmbedding()}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Only content updated since the last successful embedding will be processed.
                </p>
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
                <p>Click the button below to start generating embeddings for content items updated since your last embedding job.</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                onClick={startEmbedding} 
                disabled={isLoading || (currentJob && (currentJob.status === 'processing' || currentJob.status === 'pending'))}
              >
                {isLoading ? "Starting..." : "Generate Embeddings"}
              </Button>
              <Button 
                variant="outline" 
                onClick={refreshJobHistory} 
                disabled={isLoading}
              >
                Refresh Status
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {previousJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Job History</CardTitle>
                <CardDescription>
                  History of your embedding jobs. Last updated: {lastUpdated}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Your embedding job history</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previousJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.id.slice(0, 8)}...</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>{formatDate(job.started_at)}</TableCell>
                        <TableCell>{job.completed_at ? formatDate(job.completed_at) : "N/A"}</TableCell>
                        <TableCell>{job.items_processed} / {job.total_items}</TableCell>
                        <TableCell>
                          {job.error ? (
                            <span className="text-red-500 text-xs">{job.error}</span>
                          ) : job.status === 'completed' ? (
                            <span className="text-green-500">Success</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Embedding Metrics</h2>
            <p className="text-muted-foreground">
              View metrics related to your embedding jobs.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <WebhookDebugger />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Embedding;
