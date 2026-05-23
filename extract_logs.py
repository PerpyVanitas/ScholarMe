import json
import os

convo_ids = [
    '5d0befbe-e364-4f6f-a4ad-f4cb11c6d0a8',
    '4166acc3-cbc0-4d4e-90c4-4e1ed9851873',
    '42ac5724-f98e-42a5-b8d6-b321575cd366'
]

for cid in convo_ids:
    path = f"C:\\Users\\VAN WOODROE\\.gemini\\antigravity-ide\\brain\\{cid}\\.system_generated\\logs\\transcript.jsonl"
    print(f"\n--- Conversation: {cid} ---")
    if not os.path.exists(path):
        print("Not found.")
        continue
        
    user_inputs = []
    actions = []
    
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('type') == 'USER_INPUT':
                    content = data.get('content', '')
                    # Truncate content for display
                    if isinstance(content, str):
                        user_inputs.append(content[:200].replace('\n', ' '))
                if 'tool_calls' in data and data['tool_calls']:
                    for tc in data['tool_calls']:
                        if 'function' in tc and 'name' in tc['function']:
                            name = tc['function']['name']
                            if name in ['replace_file_content', 'multi_replace_file_content', 'write_to_file', 'run_command']:
                                try:
                                    args = json.loads(tc['function'].get('arguments', '{}'))
                                    target = args.get('TargetFile', args.get('CommandLine', ''))
                                    actions.append(f"{name}: {target}")
                                except:
                                    pass
            except Exception as e:
                pass
                
    print("Last 3 User Inputs:")
    for u in user_inputs[-3:]:
        print(" -", u)
        
    print("Last 5 Actions:")
    for a in actions[-5:]:
        print(" -", a)
