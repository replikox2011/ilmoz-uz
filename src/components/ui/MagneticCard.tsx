import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function MagneticCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const target = wrapper.firstElementChild as HTMLElement;
    if (!target) return;

    gsap.set(target, { transformPerspective: 1200 });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(target, {
        rotationY: 10 * (x / (rect.width / 2)),
        rotationX: -10 * (y / (rect.height / 2)),
        ease: 'power2.out',
        duration: 0.4,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(target, {
        rotationY: 0,
        rotationX: 0,
        ease: 'power3.out',
        duration: 0.8,
      });
    };

    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      wrapper.removeEventListener('mousemove', handleMouseMove);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, { scope: wrapperRef });

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
}
