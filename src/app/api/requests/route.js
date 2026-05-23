import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/requests.json');

// Helper to read data safely
function readRequestsFromFile() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      // Create empty file if not exists
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      fs.writeFileSync(dataFilePath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading requests database:', err);
    return [];
  }
}

// Helper to write data safely
function writeRequestsToFile(requests) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(requests, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing requests database:', err);
    return false;
  }
}

// GET: Returns list of all requests
export async function GET() {
  const requests = readRequestsFromFile();
  return Response.json(requests);
}

// POST: Adds a new request (supports multiple or single, and handles duplicates)
export async function POST(request) {
  try {
    const body = await request.json();
    const currentRequests = readRequestsFromFile();
    
    // Check if it's an array of requests (from mobile sync bridge) or a single request (from web dashboard)
    const incomingRequests = Array.isArray(body) ? body : [body];
    let addedCount = 0;
    let updatedCount = 0;

    for (const req of incomingRequests) {
      if (!req.requestId) continue;

      const existingIndex = currentRequests.findIndex(r => r.requestId === req.requestId);
      if (existingIndex !== -1) {
        // Update if status changes or fields are updated
        currentRequests[existingIndex] = {
          ...currentRequests[existingIndex],
          ...req
        };
        updatedCount++;
      } else {
        // Insert new request
        currentRequests.unshift(req); // add to top
        addedCount++;
      }
    }

    const success = writeRequestsToFile(currentRequests);
    if (!success) {
      return Response.json({ error: 'Database write failed' }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: `Sync successful. Added ${addedCount} new, updated ${updatedCount} records.` 
    });
  } catch (err) {
    console.error('POST request error:', err);
    return Response.json({ error: 'Invalid payload request structure' }, { status: 400 });
  }
}
