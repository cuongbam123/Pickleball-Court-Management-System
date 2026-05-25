import React from "react";
import clsx from "clsx";

export default function Spiral({
  dots = 8,
  radius = 35,
  className,
  size = "md", // sm, md, lg
  ...props
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div
      role="status"
      className={clsx(
        "relative inline-block text-blue-600",
        sizeClasses[size] || size,
        className
      )}
      {...props}
    >
      {Array.from({ length: dots }, (_, index) => {
        const angle = (index / dots) * (2 * Math.PI);
        const x = `${50 + radius * Math.cos(angle)}%`;
        const y = `${50 + radius * Math.sin(angle)}%`;

        return (
          <span
            key={index}
            className="absolute rounded-full bg-current animate-[spiral-pulse_1.2s_infinite_ease-in-out]"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              width: "18%",
              height: "18%",
              animationDelay: `${index * 0.15}s`,
            }}
          />
        );
      })}
    </div>
  );
}
