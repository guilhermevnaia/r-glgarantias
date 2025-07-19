/**
 * Script to check the processing status of the GLú-Garantias.xlsx file
 * in the Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || "https://njdmpdpglpidamparwtr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Nzg4NiwiZXhwIjoyMDY4NDIzODg2fQ.jIPp_CrjZZZ17hfjj7ok4cXw-5wOr7pPIwkG76RNJxk";

async function main() {
    try {
        // Create Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        console.log("======================================================================");
        console.log("PROCESSING STATUS CHECK FOR GLú-Garantias.xlsx");
        console.log("======================================================================");
        
        // 1. Check file_processing_logs for the most recent GLú-Garantias upload
        console.log("\n1. CHECKING FILE PROCESSING LOGS...");
        console.log("--------------------------------------------------");
        
        const { data: logs, error: logsError } = await supabase
            .from('file_processing_logs')
            .select('*')
            .ilike('filename', '%GLú-Garantias%')
            .order('processed_at', { ascending: false })
            .limit(10);
        
        if (logsError) {
            console.log(`Error fetching logs: ${logsError.message}`);
        } else if (logs && logs.length > 0) {
            const latestLog = logs[0];
            console.log(`Latest processing log found:`);
            console.log(`  - Filename: ${latestLog.filename || 'N/A'}`);
            console.log(`  - Processed at: ${latestLog.processed_at || 'N/A'}`);
            console.log(`  - Status: ${latestLog.status || 'N/A'}`);
            console.log(`  - Original rows: ${latestLog.original_rows || 'N/A'}`);
            console.log(`  - Processed rows: ${latestLog.processed_rows || 'N/A'}`);
            console.log(`  - Filtered rows: ${latestLog.filtered_rows || 'N/A'}`);
            console.log(`  - Error count: ${latestLog.error_count || 'N/A'}`);
            console.log(`  - Processing time: ${latestLog.processing_time_ms || 'N/A'} ms`);
            
            if (latestLog.error_details) {
                console.log(`  - Error details: ${JSON.stringify(latestLog.error_details, null, 2)}`);
            }
            
            if (logs.length > 1) {
                console.log(`\nAll GLú-Garantias processing logs (${logs.length} found):`);
                logs.forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log.filename} - ${log.processed_at} - ${log.status}`);
                });
            }
        } else {
            console.log("  No processing logs found for GLú-Garantias file.");
        }
        
        // 2. Check service_orders table for total records
        console.log("\n2. CHECKING SERVICE ORDERS TABLE...");
        console.log("--------------------------------------------------");
        
        // Count total service orders
        const { count: totalOrders, error: countError } = await supabase
            .from('service_orders')
            .select('id', { count: 'exact' });
        
        if (countError) {
            console.log(`Error counting service orders: ${countError.message}`);
        } else {
            console.log(`Total service orders in database: ${totalOrders || 0}`);
        }
        
        // Get recent orders (last 10 to check if they're from GLú-Garantias)
        const { data: recentOrders, error: recentError } = await supabase
            .from('service_orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (recentError) {
            console.log(`Error fetching recent orders: ${recentError.message}`);
        } else if (recentOrders && recentOrders.length > 0) {
            console.log(`\nRecent service orders (last 10):`);
            recentOrders.forEach((order, index) => {
                console.log(`  ${index + 1}. Order: ${order.order_number || 'N/A'} | Date: ${order.order_date || 'N/A'} | Created: ${order.created_at || 'N/A'}`);
            });
        }
        
        // 3. Check processing_errors table
        console.log("\n3. CHECKING PROCESSING ERRORS...");
        console.log("--------------------------------------------------");
        
        const { data: errors, error: errorsError } = await supabase
            .from('processing_errors')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (errorsError) {
            console.log(`Error fetching processing errors: ${errorsError.message}`);
        } else if (errors && errors.length > 0) {
            console.log(`Recent processing errors (last 20):`);
            errors.forEach((error, index) => {
                const errorMsg = error.error_message || 'N/A';
                const truncatedMsg = errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg;
                console.log(`  ${index + 1}. Error: ${truncatedMsg}`);
                console.log(`     Row: ${error.row_number || 'N/A'} | Created: ${error.created_at || 'N/A'}`);
            });
        } else {
            console.log("  No processing errors found.");
        }
        
        // 4. Summary analysis
        console.log("\n4. SUMMARY ANALYSIS");
        console.log("--------------------------------------------------");
        
        if (logs && logs.length > 0) {
            const log = logs[0];
            const originalRows = log.original_rows || 0;
            const processedRows = log.processed_rows || 0;
            const filteredRows = log.filtered_rows || 0;
            const errorCount = log.error_count || 0;
            
            console.log(`Expected total rows in Excel file: ~17,000 (9.9MB)`);
            console.log(`Actual original rows found: ${originalRows}`);
            console.log(`Rows processed: ${processedRows}`);
            console.log(`Rows that passed filters: ${filteredRows}`);
            console.log(`Rows inserted into database: ${totalOrders || 0}`);
            console.log(`Processing errors: ${errorCount}`);
            
            // Calculate percentages
            if (originalRows > 0) {
                const processedPct = (processedRows / originalRows) * 100;
                const filteredPct = (filteredRows / originalRows) * 100;
                console.log(`\nProcessing efficiency:`);
                console.log(`  - Processed: ${processedPct.toFixed(1)}% of original rows`);
                console.log(`  - Filtered: ${filteredPct.toFixed(1)}% of original rows`);
            }
            
            // Status assessment
            if (log.status === 'completed' && errorCount === 0) {
                console.log(`\n✅ Processing Status: SUCCESS`);
            } else if (log.status === 'completed' && errorCount > 0) {
                console.log(`\n⚠️  Processing Status: COMPLETED WITH ERRORS`);
            } else {
                console.log(`\n❌ Processing Status: FAILED OR INCOMPLETE`);
            }
        } else {
            console.log("❌ No processing logs found - file may not have been processed yet.");
        }
        
        console.log("\n======================================================================");
        
    } catch (error) {
        console.error(`Error connecting to Supabase: ${error.message}`);
        console.error("Please check your internet connection and Supabase credentials.");
    }
}

// Run the script
main().catch(console.error);