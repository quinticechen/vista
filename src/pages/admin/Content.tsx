
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Content = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Content Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            This section will allow you to manage website content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content management features coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Content;
