const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanDuplicates() {
  console.log("🧹 LIMPEZA DE DUPLICATAS VIA SQL...");
  
  // SQL para manter apenas a classificação mais recente de cada defeito
  const cleanupSQL = `
    DELETE FROM defect_classifications 
    WHERE id NOT IN (
      SELECT DISTINCT ON (service_order_id) id
      FROM defect_classifications 
      ORDER BY service_order_id, created_at DESC
    )
  `;
  
  try {
    const { data, error } = await supabase.rpc("exec_sql", { sql: cleanupSQL });
    
    if (error) {
      console.error("❌ Erro SQL:", error.message);
    } else {
      console.log("✅ Duplicatas removidas com sucesso");
    }
  } catch (err) {
    console.log("❌ Método SQL não disponível. Usando método alternativo...");
    
    // Método alternativo: buscar e deletar duplicatas manualmente
    const { data: classifications } = await supabase
      .from("defect_classifications")
      .select("id, service_order_id")
      .order("service_order_id")
      .order("created_at", { ascending: false });
    
    const seen = new Set();
    const toDelete = [];
    
    classifications.forEach(c => {
      if (seen.has(c.service_order_id)) {
        toDelete.push(c.id);
      } else {
        seen.add(c.service_order_id);
      }
    });
    
    console.log("Duplicatas a remover:", toDelete.length);
    
    // Remover em batches
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      await supabase.from("defect_classifications").delete().in("id", batch);
      console.log("Removidas:", i + batch.length, "/", toDelete.length);
    }
  }
  
  // Verificar resultado
  const { count } = await supabase
    .from("defect_classifications")
    .select("*", { count: "exact", head: true });
  
  console.log("📊 Total final:", count, "classificações");
}

cleanDuplicates();
