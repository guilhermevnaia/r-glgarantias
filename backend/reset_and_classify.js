const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetAndReclassify() {
  console.log("🔄 RESETANDO E RECLASSIFICANDO CORRETAMENTE...");
  
  // 1. Limpar TODAS as classificações
  console.log("1. Removendo todas as classificações...");
  const { error: deleteError } = await supabase
    .from("defect_classifications")
    .delete()
    .neq("id", 0);
  
  if (deleteError) {
    console.error("❌ Erro ao limpar:", deleteError.message);
    return;
  }
  
  console.log("✅ Todas as classificações removidas");
  
  // 2. Buscar TODOS os defeitos únicos
  console.log("2. Buscando todos os defeitos únicos...");
  // Buscar TODOS sem limit
  let allDefects = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: batch } = await supabase
      .from("service_orders")
      .select("id, raw_defect_description")
      .not("raw_defect_description", "is", null)
      .neq("raw_defect_description", "")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (!batch || batch.length === 0) break;
    allDefects = allDefects.concat(batch);
    page++;
    console.log(`Carregando página ${page}: ${batch.length} defeitos (total: ${allDefects.length})`);
  }
  
  console.log("Defeitos únicos encontrados:", allDefects.length);
  
  // 3. Classificar cada um apenas UMA vez
  console.log("3. Classificando cada defeito uma única vez...");
  
  function classify(description) {
    const desc = description.toLowerCase();
    if (desc.includes("vazamento")) return { categoryId: 27, confidence: 0.8, reasoning: "Vazamento" };
    if (desc.includes("barulho")) return { categoryId: 33, confidence: 0.7, reasoning: "Ruído" };
    if (desc.includes("folga")) return { categoryId: 33, confidence: 0.7, reasoning: "Folga" };
    if (desc.includes("quebra")) return { categoryId: 36, confidence: 0.8, reasoning: "Quebra" };
    if (desc.includes("temperatura")) return { categoryId: 26, confidence: 0.7, reasoning: "Temperatura" };
    return { categoryId: 28, confidence: 0.5, reasoning: "Outros" };
  }
  
  // Classificar em batches
  const batchSize = 100;
  let processed = 0;
  
  for (let i = 0; i < allDefects.length; i += batchSize) {
    const batch = allDefects.slice(i, i + batchSize);
    
    const classifications = batch.map(defect => {
      const classification = classify(defect.raw_defect_description);
      return {
        service_order_id: defect.id,
        category_id: classification.categoryId,
        ai_confidence: classification.confidence,
        ai_reasoning: classification.reasoning,
        original_defect_description: defect.raw_defect_description.substring(0, 500),
        created_at: new Date().toISOString()
      };
    });
    
    const { error } = await supabase
      .from("defect_classifications")
      .insert(classifications);
    
    if (!error) {
      processed += batch.length;
      console.log("✅ Processados:", processed, "/", allDefects.length);
    } else {
      console.error("❌ Erro:", error.message);
      break;
    }
  }
  
  console.log("🎯 CLASSIFICAÇÃO ÚNICA CONCLUÍDA:", processed, "defeitos classificados");
}

resetAndReclassify();
