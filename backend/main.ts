import { processProtocolLine } from "./protocol.ts";

const encoder = new TextEncoder();

async function writeMessage(message: unknown): Promise<void> {
  await Deno.stdout.write(encoder.encode(`${JSON.stringify(message)}\n`));
}

async function* inputLines(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line.length > 0) yield line;
        newlineIndex = buffer.indexOf("\n");
      }
    }

    const finalLine = buffer.trim();
    if (finalLine.length > 0) yield finalLine;
  } finally {
    reader.releaseLock();
  }
}

for await (const line of inputLines(Deno.stdin.readable)) {
  const processed = await processProtocolLine(line);
  await writeMessage(processed.response);
  if (processed.shouldStop) break;
}
