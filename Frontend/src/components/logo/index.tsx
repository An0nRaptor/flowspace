import { AudioWaveform } from "lucide-react";
import { Link } from "react-router-dom";

// Pass `url` to make the logo a link; omit it when the logo already sits inside a link.
const Logo = (props: { url?: string }) => {
  const { url } = props;
  const icon = (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <AudioWaveform className="size-4" />
    </div>
  );
  return (
    <div className="flex items-center justify-center sm:justify-start">
      {url ? <Link to={url}>{icon}</Link> : icon}
    </div>
  );
};

export default Logo;
