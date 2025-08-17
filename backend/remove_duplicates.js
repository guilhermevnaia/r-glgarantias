const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function removeDuplicateClassifications() {
  console.log("🧹 REMOVENDO CLASSIFICAÇÕES DUPLICADAS...");
  
  // Buscar todas as classificações ordenadas por data (mais recente primeiro)
  const { data: allClassifications } = await supabase
    .from("defect_classifications")
    .select("id, service_order_id, created_at")
    .order("service_order_id")
    .order("created_at", { ascending: false });
  
  console.log("Total de classificações encontradas:", allClassifications.length);
  
  // Agrupar por service_order_id e manter apenas a mais recente
  const seen = new Set();
  const toDelete = [];
  
  allClassifications.forEach(classification => {
    if (seen.has(classification.service_order_id)) {
      // Duplicata - marcar para exclusão
      toDelete.push(classification.id);
    } else {
      // Primeira ocorrência - manter
      seen.add(classification.service_order_id);
    }
  });
  
  console.log("Classificações únicas a manter:", seen.size);
  console.log("Duplicatas a remover:", toDelete.length);
  
  if (toDelete.length > 0) {
    // Remover duplicatas em batches
    const batchSize = 100;
    let removed = 0;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from("defect_classifications")
        .delete()
        .in("id", batch);
      
      if (\!error) {
        removed += batch.length;
        console.log("✅ Removidas", batch.length, "| Total:", removed, "/", toDelete.length);
      } else {
        console.error("❌ Erro:", error.message);
        break;
      }
    }
    
    console.log("🎯 Limpeza concluída:", removed, "duplicatas removidas");
  }
  
  // Verificar resultado final
  const { count: finalCount } = await supabase
    .from("defect_classifications")
    .select("*", { count: "exact", head: true });
  
  console.log("📊 Total final de classificações:", finalCount);
}

removeDuplicateClassifications();
