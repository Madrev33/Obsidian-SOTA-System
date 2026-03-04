---
id_habito: "%%ID_HABITO%%"
nome_habito: "%%NOME_HABITO%%"
tipo_habito: habito
ativo: true
frequencia: diaria
tipo_comportamento: binario
meta_numerica: 1
tipo_input: booleano
tier_desafio: Fácil
categoria_impacto: Saúde
tags:
  - habito
---


## ⚙️ Gestão

> [!multi-column]
>
>> [!info] Status do Hábito
>> **Situação Atual:** `= choice(this.ativo, "🟢 Ativo", "🔴 Inativo")`
>>
>> ```meta-bind-button
>> label: "Toggle Status"
>> style: "default"
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const file = this.app.workspace.getActiveFile();
>>       if (file) {
>>         await this.app.fileManager.processFrontMatter(file, (fm) => {
>>           fm.ativo = !fm.ativo;
>>         });
>>         new obsidian.Notice(`Hábito ${this.app.metadataCache.getFileCache(file).frontmatter.ativo ? 'desativado' : 'ativado'}!`);
>>       }
>> ```

---


## 📊 Análise de Consistência

> [!multi-column]
>
>> [!info] Estatísticas Chave
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Habitos/renderHabitStats", { dashboard: dv.current() })
>> ```

---

> [!multi-column]
>
>> [!info] Histórico Visual
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Habitos/renderHabitHeatmap", { dashboard: dv.current() })
>> ```


---


## 🔬 O Porquê (Princípios)
> Descreva aqui os benefícios científicos, filosóficos ou pessoais deste hábito.

## 🚀 Como Executar (Protocolo)
> Detalhe o passo a passo para a execução correta do hábito.

## ❌ Pontos de Falha (Antifragilidade)
> Liste os erros comuns a serem evitados e como contorná-los.

## 🔗 Conexões e Sinergias
> Como este hábito interage ou potencializa outros hábitos?

