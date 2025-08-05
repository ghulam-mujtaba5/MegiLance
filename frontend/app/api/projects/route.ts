// @AI-HINT: This API route reads project data from a JSON file in the central 'db' directory and serves it to the frontend. This simulates a real API endpoint.

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Construct the path to the db directory, which is one level above the Next.js project root.
    const jsonDirectory = path.resolve(process.cwd(), '..', 'db');
    const filePath = path.join(jsonDirectory, 'projects.json');
    
    // Read the JSON file.
    const fileContents = await fs.readFile(filePath, 'utf8');
    
    // Parse the JSON data and return it.
    const projects = JSON.parse(fileContents);
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error reading projects data:', error);
    // Return a 500 error if something goes wrong.
    return new NextResponse('Error fetching projects data.', { status: 500 });
  }
}
