'use client'

import Image from 'next/image'
import React from 'react'

export default function SocialButtons() {
  const links = [
    {
      label: 'Twitter',
      href: 'https://x.com/',
      image: '/assets/twitter.png',
    },
    {
      label: 'Chart',
      href: 'https://dexscreener.com',
      image: '/assets/chart2.png',
    },
    {
      label: 'Buy Here',
      href: 'https://moonshot.money',
      image: '/assets/buy2.png',
    },
  ]

  return (
    <div className="mt-12 text-white text-center">
      <h2 className="text-xl font-bold mb-6">Join the Magic</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {links.map(({ label, href, image }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center bg-white/10 hover:bg-white/20 p-4 rounded-xl transition duration-300 w-40"
          >
            <div className="w-16 h-16 mb-2 relative">
              <Image
                src={image}
                alt={label}
                fill
                className="object-contain rounded"
              />
            </div>
            <span className="font-semibold text-sm">{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
