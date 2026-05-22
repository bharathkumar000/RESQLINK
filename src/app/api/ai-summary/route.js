export async function POST(req) {
  try {
    const { sensorData } = await req.json();
    const prompt = `As a Disaster Response AI Assistant, analyze these sensor readings and provide a 2-sentence tactical summary for the incident commander. Mention any critical threats.
    Readings: ${JSON.stringify(sensorData)}`;

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma4:latest',
        prompt: prompt,
        stream: false
      })
    });

    const data = await ollamaResponse.json();
    return Response.json({ summary: data.response });
  } catch (error) {
    console.error("AI Error:", error);
    return Response.json({ error: "AI processing failed" }, { status: 500 });
  }
}
