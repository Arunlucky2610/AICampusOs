import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  onClick?: () => void;
  gradient?: boolean;
  hover?: boolean;
}

export function PremiumCard({ children, className, index = 0, onClick, gradient, hover = true }: PremiumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-[20px] border border-[rgba(108,76,241,0.06)] bg-white p-5 transition-all duration-300",
        hover && "cursor-pointer hover:border-[rgba(108,76,241,0.15)] hover:shadow-[0_12px_40px_rgba(108,76,241,0.08)]",
        gradient && "gradient-border",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
