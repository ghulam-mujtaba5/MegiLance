// @AI-HINT: This file contains mock data for blog posts to be displayed on the blog page.

import { BlogPostCardProps } from '@/app/components/Public/BlogPostCard/BlogPostCard';

export const mockPosts: BlogPostCardProps[] = [
  {
    slug: 'mastering-defi-a-beginners-guide',
    title: 'Mastering DeFi: A Beginner’s Guide to Decentralized Finance',
    excerpt: 'Dive into the world of DeFi and learn how to navigate the complexities of decentralized exchanges, lending protocols, and more.',
    imageUrl: '/images/blog/defi-guide.jpg',
    author: 'Alice Johnson',
    date: 'August 8, 2025',
    content: `
      <p>Decentralized Finance (DeFi) is a revolutionary movement built on blockchain technology that aims to create an open, permissionless, and transparent financial service ecosystem. Unlike traditional finance, DeFi is not controlled by a single, centralized entity.</p>
      <h2>What is a DEX?</h2>
      <p>A Decentralized Exchange (DEX) is a peer-to-peer marketplace where cryptocurrency traders make transactions directly with one another. DEXs are a cornerstone of DeFi, offering users more control over their funds and greater resistance to censorship.</p>
      <h2>Lending and Borrowing</h2>
      <p>DeFi lending platforms allow users to lend their crypto and earn interest, or borrow assets against their holdings. These platforms use smart contracts to automate the process, removing the need for traditional financial intermediaries.</p>
      <p>By understanding these core components, you can begin your journey into the exciting and rapidly evolving world of Decentralized Finance.</p>
    `,
  },
  {
    slug: 'the-art-of-the-perfect-logo',
    title: 'The Art of the Perfect Logo: A Freelancer’s Perspective',
    excerpt: 'Discover the principles of great logo design and how to create a lasting brand identity for your clients.',
    imageUrl: '/images/blog/logo-design.jpg',
    author: 'Bob Williams',
    date: 'August 5, 2025',
    content: `
      <p>A logo is more than just an image; it's the cornerstone of a brand's identity. For freelancers, crafting the perfect logo for a client is a critical skill that blends artistry with strategy.</p>
      <h2>Simplicity is Key</h2>
      <p>The most iconic logos are often the simplest. Think of Nike, Apple, or McDonald's. A simple logo is easily recognizable, memorable, and versatile across different mediums.</p>
      <h2>Color Psychology</h2>
      <p>Color plays a vital role in shaping perception. Understanding color psychology can help you choose a palette that resonates with the brand's target audience and communicates the right message.</p>
    `,
  },
  {
    slug: 'securing-your-smart-contracts',
    title: 'Top 5 Security Practices for Smart Contracts',
    excerpt: 'Learn how to protect your smart contracts from common vulnerabilities and ensure the safety of your users’ funds.',
    imageUrl: '/images/blog/smart-contracts.jpg',
    author: 'Charlie Brown',
    date: 'August 2, 2025',
    content: `
      <p>With great power comes great responsibility. Smart contracts handle significant value, making their security paramount. Ignoring security can lead to catastrophic losses.</p>
      <h2>1. Use Trusted Libraries</h2>
      <p>Don't reinvent the wheel. Use well-audited libraries like OpenZeppelin for common patterns like ERC20 or ERC721. This reduces the risk of introducing vulnerabilities.</p>
      <h2>2. Implement Access Control</h2>
      <p>Ensure that only authorized addresses can execute critical functions. The Ownable pattern is a simple yet effective way to manage administrative privileges.</p>
      <h2>3. Handle External Calls with Care</h2>
      <p>Interactions with external contracts can be risky. Always use the Checks-Effects-Interactions pattern to avoid reentrancy attacks.</p>
    `,
  },
  {
    slug: 'freelancer-productivity-hacks',
    title: '10 Productivity Hacks for the Modern Freelancer',
    excerpt: 'Boost your efficiency and reclaim your time with these proven productivity strategies tailored for freelance professionals.',
    imageUrl: '/images/blog/productivity.jpg',
    author: 'Diana Prince',
    date: 'July 28, 2025',
    content: `
      <p>Freelancing offers freedom, but it demands discipline. Mastering productivity is essential for success. Here are ten hacks to help you work smarter, not harder.</p>
      <h3>1. The Pomodoro Technique</h3>
      <p>Work in focused 25-minute intervals, separated by short breaks. This technique helps maintain high concentration and prevents burnout.</p>
      <h3>2. Time Blocking</h3>
      <p>Schedule your entire day in blocks of time dedicated to specific tasks. This creates structure and ensures that important work gets done.</p>
    `,
  },
  {
    slug: 'navigating-crypto-taxes',
    title: 'A Simple Guide to Navigating Crypto Taxes',
    excerpt: 'Understand your tax obligations and learn how to report your cryptocurrency gains and losses with confidence.',
    imageUrl: '/images/blog/crypto-taxes.jpg',
    author: 'Ethan Hunt',
    date: 'July 25, 2025',
    content: `
      <p>Cryptocurrency taxes can be complex, but they don't have to be intimidating. This guide breaks down the basics of what you need to know.</p>
      <h4>Capital Gains</h4>
      <p>In most jurisdictions, cryptocurrencies are treated as property. This means you'll owe capital gains tax when you sell, trade, or spend your crypto for more than you acquired it for.</p>
      <h4>Tracking is Everything</h4>
      <p>Keep meticulous records of all your transactions. Use a crypto tax software to automate the process and ensure accuracy. This will save you a massive headache when tax season arrives.</p>
    `,
  },
  {
    slug: 'building-a-dapp-from-scratch',
    title: 'Building Your First dApp: A Step-by-Step Tutorial',
    excerpt: 'Follow our comprehensive guide to build and deploy your very first decentralized application on the Ethereum blockchain.',
    imageUrl: '/images/blog/dapp-tutorial.jpg',
    author: 'Fiona Glenanne',
    date: 'July 21, 2025',
    content: `
      <p>Ready to build the future? This tutorial will walk you through creating a simple decentralized application (dApp) from scratch.</p>
      <h4>Setting Up Your Environment</h4>
      <p>You'll need Node.js, a code editor like VS Code, and a browser wallet like MetaMask. We'll use the Hardhat development environment to compile, test, and deploy our smart contract.</p>
      <h4>Writing the Smart Contract</h4>
      <p>We'll write a basic smart contract in Solidity that allows users to store and retrieve a message. This will cover the fundamentals of contract structure, variables, and functions.</p>
    `,
  },
];
