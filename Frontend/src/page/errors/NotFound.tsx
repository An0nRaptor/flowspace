import { Link } from "react-router-dom";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted p-6">
      <Logo />
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link to="/">Back to FlowSpace</Link>
      </Button>
    </div>
  );
};

export default NotFound;
