import React from 'react'
import { motion } from 'framer-motion'

interface LogoProps {
  className?: string
  variant?: 'full' | 'icon' | 'compact'
  color?: 'default' | 'white' | 'violet' | 'dark'
  animate?: boolean
}

export const ExpertLogo: React.FC<LogoProps> = ({ 
  className = 'h-8', 
  variant = 'full',
  color = 'default',
  animate = true
}) => {
  const violet = '#6C4DFF'
  const isDarkLogo = color === 'dark'
  const accentColor = color === 'white' ? '#FFFFFF' : violet
  const organicColor = isDarkLogo ? '#111318' : color === 'violet' ? violet : '#FFFFFF'
  const nodeFill = isDarkLogo ? '#FFFFFF' : '#050A12'
  const expertTextColor = isDarkLogo ? 'text-[#111318]' : color === 'violet' ? 'text-[#6C4DFF]' : 'text-white'
  const clubTextColor = isDarkLogo || color === 'violet' ? 'text-[#6C4DFF]' : 'text-white'
  const bylineColor = isDarkLogo ? 'text-[#2A2E36]' : 'text-white/58'

  const BrainIcon = () => (
    <motion.svg 
      viewBox="0 0 100 100" 
      className="h-full w-auto" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      initial={animate ? { scale: 0.95 } : {}}
      animate={animate ? { 
        scale: [0.98, 1.02, 0.98],
      } : {}}
      transition={{ 
        duration: 4, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {/* Left Side: Organic Brain (Fidelity 1:1 with image) */}
      <path
        d="M48 18.5C41 18.5 35 21 32 26C27 24 21 26 18 31C14 38 15 48 20 54C17 62 19 72 27 78C33 83 42 83 48 78V18.5Z"
        stroke={organicColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 38C31 38 29 40 28 43"
        stroke={organicColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M28 62C26 62 25 63 24 65"
        stroke={organicColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Right Side: Circuit Tech Brain (Fidelity 1:1 with image) */}
      <motion.g>
        {/* Main Split Path */}
        <motion.path
          d="M52 18.5V81.5"
          stroke={accentColor}
          strokeWidth="5"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0 } : {}}
          animate={animate ? { pathLength: 1 } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Top Node & Path */}
        <motion.path
          d="M52 28L60 18H78"
          stroke={accentColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : {}}
          animate={animate ? { pathLength: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.circle 
          cx="78" cy="18" r="4.5" 
          fill={nodeFill}
          stroke={accentColor} 
          strokeWidth="3"
          animate={animate ? { r: [4.5, 5.5, 4.5], fill: [accentColor, nodeFill, accentColor] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Middle Node 1 */}
        <motion.path
          d="M52 45H68V32L82 42"
          stroke={accentColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : {}}
          animate={animate ? { pathLength: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
        />
        <motion.circle 
          cx="82" cy="42" r="4.5" 
          fill={nodeFill}
          stroke={accentColor} 
          strokeWidth="3"
          animate={animate ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />

        {/* Middle Node 2 */}
        <motion.path
          d="M52 62L68 78H85"
          stroke={accentColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : {}}
          animate={animate ? { pathLength: 1 } : {}}
          transition={{ duration: 1, delay: 1.1 }}
        />
        <motion.circle 
          cx="85" cy="78" r="4.5" 
          fill={nodeFill}
          stroke={accentColor} 
          strokeWidth="3"
          animate={animate ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
        />

        {/* Node with extension */}
        <motion.circle 
          cx="68" cy="55" r="4.5" 
          fill={nodeFill}
          stroke={accentColor} 
          strokeWidth="3"
          animate={animate ? { strokeWidth: [3, 5, 3] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <path d="M52 55H63.5" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  )

  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {animate && (
          <div className="absolute inset-0 bg-ec-violet/10 blur-3xl rounded-full scale-150 animate-pulse" />
        )}
        <BrainIcon />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 ${className} ${variant === 'compact' ? 'ec-ref-logo--compact' : ''}`}>
      <div className="h-full aspect-square relative flex items-center justify-center">
        <BrainIcon />
        {animate && (
          <motion.div 
            className="absolute top-1/2 right-0 -translate-y-1/2 w-[120%] h-[120%] bg-[#5B4BFF]/10 blur-3xl rounded-full -z-10"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        )}
      </div>
      
      {(variant === 'full' || variant === 'compact') && (
        <div className="flex flex-col justify-center">
          <div className="flex flex-col leading-none">
            <span className={`font-display text-[1.6em] font-black uppercase tracking-[0.2em] ${expertTextColor}`}>
              EXPERT
            </span>
            <span className={`font-display text-[1.6em] font-semibold uppercase tracking-[0.32em] ${clubTextColor} -mt-1.5`}>
              CLUB
            </span>
          </div>
          {variant === 'full' && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className={`text-[0.44em] font-black uppercase tracking-[0.28em] ${bylineColor}`}>
                BY EXPERT COACHING
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
