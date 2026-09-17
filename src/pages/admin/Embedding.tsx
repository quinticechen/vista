import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  fetchEmbeddingJobs, 
  getEmbeddingJob, 
  createEmbeddingJob, 
  startEmbeddingProcess,
  getEmbeddingStats,
  type EmbeddingJob,
  type EmbeddingStats
} from "@/services/adminService";
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, FileText, Database } from "lucide-react";

const Embedding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<EmbeddingJob | null>(null);
  const [previousJobs, setPreviousJobs] = useState<EmbeddingJob[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [stats, setStats] = useState<EmbeddingStats>({ totalCount: 0, embeddedCount: 0, missingCount: 0 });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedJobsRef = useRef<Set<string>>(new Set());
  
  // Initialize and check for active jobs
  useEffect(() => {
    refreshJobHistory();
    loadStats();
    
    // Cleanup interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentStats = await getEmbeddingStats(user.id);
      setStats(currentStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Refresh job history
  const refreshJobHistory = async () => {
    const jobs = await fetchEmbeddingJobs();
    setLastUpdated(new Date().toLocaleString());
    await loadStats();
    
    // Check for any processing jobs
    const processingJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
    if (processingJobs.length > 0) {
      setCurrentJob(processingJobs[0]);
      setPreviousJobs(jobs.filter(job => job.id !== processingJobs[0].id));
      
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Set up polling for the current job
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(processingJobs[0].id);
      }, 5000);
    } else {
      setPreviousJobs(jobs);
      setCurrentJob(null);
      
      // Clear polling when no active jobs
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
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
    
    // Check if job is complete and we haven't notified about this job yet
    if ((jobData.status === 'completed' || jobData.status === 'error' || jobData.status === 'partial_success') 
        && !notifiedJobsRef.current.has(jobId)) {
      
      // Mark this job as notified
      notifiedJobsRef.current.add(jobId);
      
      // Clear the polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Show appropriate notification
      if (jobData.status === 'error') {
        toast.error(`Embedding process failed: ${jobData.error || 'Unknown error'}`);
      } else if (jobData.status === 'partial_success') {
        toast.warning(`Embedding process completed with some errors: ${jobData.error}`);
      } else {
        toast.success("Embedding process completed successfully");
      }
      
      // Refresh job history and stats to update the UI
      await refreshJobHistory();
    }
  };

  // Start embedding process
  const startEmbedding = async (forceAll: boolean = false) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const countToProcess = forceAll ? stats.totalCount : stats.missingCount;
      
      // Create a new job
      const jobData = await createEmbeddingJob(user.id, countToProcess);
      
      if (!jobData) {
        throw new Error("Failed to create job");
      }
      
      setCurrentJob(jobData);
      
      // Call the edge function to start the embedding process
      const success = await startEmbeddingProcess(jobData.id, forceAll);
      
      if (!success) {
        throw new Error("Failed to start embedding process via Edge Function");
      }
      
      toast.success(forceAll ? "Full embedding process started" : "Missing embeddings process started");
      
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Start polling for job status
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(jobData.id);
      }, 5000);
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
    
    const lastSuccessful = completedJobs[0];
    return formatDate(lastSuccessful.started_at);
  };

  const coveragePercent = stats.totalCount > 0 
    ? Math.round((stats.embeddedCount / stats.totalCount) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Embedding Management</h1>
        <p className="text-muted-foreground">
          Generate and manage embeddings for your content to enable AI-powered semantic search
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Content Items</div>
            <div className="text-2xl font-bold">{stats.totalCount}</div>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Embedded Items</div>
            <div className="text-2xl font-bold text-green-600">{stats.embeddedCount}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Missing Embeddings</div>
            <div className="text-2xl font-bold text-amber-600">{stats.missingCount}</div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job History</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Generate Content Embeddings
              </CardTitle>
              <CardDescription>
                Generate vector embeddings for your content items to enable AI-powered semantic search.
                {previousJobs.some(job => job.status === 'completed') && (
                  <p className="mt-2">
                    <strong>Last successful embedding:</strong> {getLastSuccessfulEmbedding()}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Missing embeddings or newly updated content will be embedded into 768-dimension vectors.
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
                <div className="space-y-2">
                  <p className="text-sm text-foreground">
                    {stats.missingCount > 0 
                      ? `There are ${stats.missingCount} content items that currently do not have vector embeddings.`
                      : `All ${stats.totalCount} content items currently have vector embeddings.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can generate embeddings for missing/updated items or force a full re-index of all items.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => startEmbedding(false)} 
                  disabled={isLoading || (currentJob && (currentJob.status === 'processing' || currentJob.status === 'pending'))}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isLoading ? "Starting..." : stats.missingCount > 0 ? `Embed Missing (${stats.missingCount})` : "Generate Embeddings"}
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => startEmbedding(true)} 
                  disabled={isLoading || (currentJob && (currentJob.status === 'processing' || currentJob.status === 'pending'))}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Re-embed All ({stats.totalCount})
                </Button>
              </div>

              <Button 
                variant="outline" 
                onClick={refreshJobHistory} 
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {previousJobs.length > 0 ? (
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
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No previous embedding jobs found.
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Coverage & Health</CardTitle>
              <CardDescription>
                Overview of your vector search readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Embedding Coverage</span>
                  <span className="text-sm font-bold">{coveragePercent}%</span>
                </div>
                <Progress value={coveragePercent} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.embeddedCount} of {stats.totalCount} items have search embeddings configured.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Model Specification</div>
                  <div className="text-lg font-semibold mt-1">Google Vertex AI text-embedding-005</div>
                  <div className="text-xs text-muted-foreground">768 dimensions output vector</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Database Index</div>
                  <div className="text-lg font-semibold mt-1">pgvector (Cosine Similarity)</div>
                  <div className="text-xs text-muted-foreground">match_content_items RPC</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Embedding;
