const fs = require('fs');
const readline = require('readline');

const convo_ids = [
    '5d0befbe-e364-4f6f-a4ad-f4cb11c6d0a8',
    '4166acc3-cbc0-4d4e-90c4-4e1ed9851873',
    '42ac5724-f98e-42a5-b8d6-b321575cd366'
];

async function processFile(cid) {
    const path = `C:\\Users\\VAN WOODROE\\.gemini\\antigravity-ide\\brain\\${cid}\\.system_generated\\logs\\transcript.jsonl`;
    console.log(`\n--- Conversation: ${cid} ---`);
    
    if (!fs.existsSync(path)) {
        console.log("Not found.");
        return;
    }

    const user_inputs = [];
    const actions = [];

    const fileStream = fs.createReadStream(path, { encoding: 'utf8' });
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            const data = JSON.parse(line);
            if (data.type === 'USER_INPUT') {
                const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
                user_inputs.push(content.substring(0, 200).replace(/\n/g, ' '));
            }
            if (data.tool_calls && data.tool_calls.length > 0) {
                for (const tc of data.tool_calls) {
                    if (tc.function && tc.function.name) {
                        const name = tc.function.name;
                        if (['replace_file_content', 'multi_replace_file_content', 'write_to_file', 'run_command'].includes(name)) {
                            try {
                                const args = JSON.parse(tc.function.arguments || '{}');
                                const target = args.TargetFile || args.CommandLine || '';
                                actions.push(`${name}: ${target}`);
                            } catch (e) {
                                // ignore parse errors
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // ignore JSON parse error for a line
        }
    }

    console.log("Last 3 User Inputs:");
    user_inputs.slice(-3).forEach(u => console.log(" -", u));

    console.log("Last 5 Actions:");
    actions.slice(-5).forEach(a => console.log(" -", a));
}

async function main() {
    for (const cid of convo_ids) {
        await processFile(cid);
    }
}

main();
