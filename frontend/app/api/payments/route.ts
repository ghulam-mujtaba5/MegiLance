// @AI-HINT: This API route serves payment data from a JSON file, simulating a payments endpoint.

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    const jsonDirectory = path.resolve(process.cwd(), '..', 'db');
    const filePath = path.join(jsonDirectory, 'payments.json');
    
    // Check if file exists, if not create mock data
    try {
      await fs.access(filePath);
    } catch {
      // Create mock data if file doesn't exist
      const mockPayments = {
        balance: "$1,234.56",
        transactions: [
          {
            id: "1",
            date: "2023-10-26",
            description: "Payment from Global Retail Inc.",
            amount: "+$5,000.00",
            status: "paid"
          },
          {
            id: "2",
            date: "2023-10-24",
            description: "Milestone payment for Mobile App",
            amount: "+$2,500.00",
            status: "paid"
          },
          {
            id: "3",
            date: "2023-10-22",
            description: "Withdrawal to bank account",
            amount: "-$3,000.00",
            status: "pending"
          },
          {
            id: "4",
            date: "2023-10-20",
            description: "Platform service fee",
            amount: "-$50.00",
            status: "completed"
          }
        ]
      };
      
      await fs.writeFile(filePath, JSON.stringify(mockPayments, null, 2));
    }
    
    const fileContents = await fs.readFile(filePath, 'utf8');
    const payments = JSON.parse(fileContents);
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error reading payments data:', error);
    return new NextResponse('Error fetching payments data.', { status: 500 });
  }
}