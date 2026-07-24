import json

def main():
    json_path = r"c:\Users\Usuário\Downloads\Tecnologia e Projetos\reLead-plataforma\Salva Lead — 3. Disparo Manual Planilha.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check if process 1 por vez has batchSize: 1
    split_node = None
    for node in data.get('nodes', []):
        if node.get('id') == 'wk3-split':
            split_node = node
            break
            
    if split_node:
        print("Split node found locally:")
        print(json.dumps(split_node, indent=2))
    else:
        print("Split node not found locally!")
        
if __name__ == '__main__':
    main()
