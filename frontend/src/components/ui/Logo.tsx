import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  href?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  priority?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  href,
  size = "md",
  priority = false,
}) => {
  // Map sizes to specific logo files and dimensions
  const sizeConfig = {
    xs: {
      src: "/lexprobe.png", // Footer - smallest
      width: 72,
      height: 24,
      className: "h-6 w-auto",
    },
    sm: {
      src: "/lexprobe.png", // Sidebar
      width: 96,
      height: 32,
      className: "h-8 w-auto",
    },
    md: {
      src: "/lexprobe.png", // Header/Navigation
      width: 120,
      height: 40,
      className: "h-10 w-auto",
    },
    lg: {
      src: "/lexprobe.png", // Auth pages
      width: 180,
      height: 60,
      className: "h-15 w-auto",
    },
    xl: {
      src: "/lexprobe.png", // Homepage hero
      width: 240,
      height: 80,
      className: "h-20 w-auto",
    },
  };

  const currentSize = sizeConfig[size];

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <Image
        src={currentSize.src}
        alt="Lex Probe"
        width={currentSize.width}
        height={currentSize.height}
        className={`${currentSize.className} object-contain`}
        priority={priority}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

export default Logo;
