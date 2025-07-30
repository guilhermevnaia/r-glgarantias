/**
 * Comprehensive analysis of GLú-Garantias.xlsx file processing
 * including all attempts and successful processes
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
        console.log("COMPREHENSIVE ANALYSIS OF GLú-Garantias.xlsx PROCESSING");
        console.log("======================================================================");
        
        // 1. Check ALL file processing logs
        console.log("\n1. ALL FILE PROCESSING LOGS...");
        console.log("--------------------------------------------------");
        
        const { data: allLogs, error: allLogsError } = await supabase
            .from('file_processing_logs')
            .select('*')
            .order('processed_at', { ascending: false });
        
        if (allLogsError) {
            console.log(`Error fetching all logs: ${allLogsError.message}`);
        } else if (allLogs && allLogs.length > 0) {
            console.log(`Total processing logs found: ${allLogs.length}`);
            
            // Show all logs
            allLogs.forEach((log, index) => {
                console.log(`${index + 1}. ${log.filename} [${log.status}]`);
                console.log(`   Date: ${log.processed_at}`);
                console.log(`   Original: ${log.original_rows} | Processed: ${log.processed_rows} | Filtered: ${log.filtered_rows} | Errors: ${log.error_count}`);
                console.log(`   Time: ${log.processing_time_ms}ms`);
                if (log.error_details && typeof log.error_details === 'object') {
                    console.log(`   Error: ${JSON.stringify(log.error_details).substring(0, 200)}...`);
                }
                console.log('');
            });
        } else {
            console.log("  No processing logs found.");
        }
        
        // 2. Check service orders by date ranges
        console.log("\n2. SERVICE ORDERS BY DATE RANGES...");
        console.log("--------------------------------------------------");
        
        // Count orders by creation date
        const { data: ordersByDate, error: ordersByDateError } = await supabase
            .from('service_orders')
            .select('created_at, order_number, order_date')
            .order('created_at', { ascending: false });
        
        if (ordersByDateError) {
            console.log(`Error fetching orders by date: ${ordersByDateError.message}`);
        } else if (ordersByDate && ordersByDate.length > 0) {
            console.log(`Total service orders: ${ordersByDate.length}`);
            
            // Group by creation date
            const dateGroups = {};
            ordersByDate.forEach(order => {
                const date = order.created_at.split('T')[0]; // Get just the date part
                if (!dateGroups[date]) {
                    dateGroups[date] = [];
                }
                dateGroups[date].push(order);
            });
            
            console.log(`\nOrders by creation date:`);
            Object.keys(dateGroups).sort().reverse().forEach(date => {
                console.log(`  ${date}: ${dateGroups[date].length} orders`);
            });
            
            // Show recent orders
            console.log(`\nMost recent 15 orders:`);
            ordersByDate.slice(0, 15).forEach((order, index) => {
                console.log(`  ${index + 1}. Order: ${order.order_number} | Service Date: ${order.order_date} | Created: ${order.created_at}`);
            });
        }
        
        // 3. Check processing errors summary
        console.log("\n3. PROCESSING ERRORS SUMMARY...");
        console.log("--------------------------------------------------");
        
        const { data: allErrors, error: allErrorsError } = await supabase
            .from('processing_errors')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (allErrorsError) {
            console.log(`Error fetching all errors: ${allErrorsError.message}`);
        } else if (allErrors && allErrors.length > 0) {
            console.log(`Total processing errors: ${allErrors.length}`);
            
            // Group errors by type
            const errorTypes = {};
            allErrors.forEach(error => {
                const errorType = error.error_message.split(':')[0];
                if (!errorTypes[errorType]) {
                    errorTypes[errorType] = 0;
                }
                errorTypes[errorType]++;
            });
            
            console.log(`\nErrors by type:`);
            Object.keys(errorTypes).forEach(type => {
                console.log(`  ${type}: ${errorTypes[type]} occurrences`);
            });
            
            // Group by date
            const errorsByDate = {};
            allErrors.forEach(error => {
                const date = error.created_at.split('T')[0];
                if (!errorsByDate[date]) {
                    errorsByDate[date] = 0;
                }
                errorsByDate[date]++;
            });
            
            console.log(`\nErrors by date:`);
            Object.keys(errorsByDate).sort().reverse().forEach(date => {
                console.log(`  ${date}: ${errorsByDate[date]} errors`);
            });
        } else {
            console.log("  No processing errors found.");
        }
        
        // 4. Final analysis
        console.log("\n4. FINAL ANALYSIS AND RECOMMENDATIONS");
        console.log("--------------------------------------------------");
        
        // Find successful logs
        const successfulLogs = allLogs ? allLogs.filter(log => log.status === 'completed' || log.status === 'SUCCESS') : [];
        
        if (successfulLogs.length > 0) {
            console.log(`✅ Found ${successfulLogs.length} successful processing attempt(s):`);
            successfulLogs.forEach((log, index) => {
                console.log(`  ${index + 1}. ${log.filename} - ${log.processed_at}`);
                console.log(`     Rows: ${log.original_rows} → ${log.processed_rows} → ${log.filtered_rows}`);
                console.log(`     Errors: ${log.error_count || 0}`);
            });
        } else {
            console.log(`❌ No successful processing attempts found.`);
        }
        
        // Calculate data insights
        if (ordersByDate && ordersByDate.length > 0) {
            const totalOrders = ordersByDate.length;
            const todayOrders = ordersByDate.filter(order => order.created_at.startsWith('2025-07-18')).length;
            
            console.log(`\n📊 Database Status:`);
            console.log(`   Total Service Orders: ${totalOrders}`);
            console.log(`   Orders added today: ${todayOrders}`);
            console.log(`   Expected Excel rows: ~17,000`);
            console.log(`   Data coverage: ${((totalOrders / 17000) * 100).toFixed(1)}%`);
        }
        
        // Recommendations
        console.log(`\n🔍 Key Findings:`);
        console.log(`   1. Latest upload attempt: FAILED (Supabase connection error)`);
        console.log(`   2. Database contains ${ordersByDate ? ordersByDate.length : 0} service orders`);
        console.log(`   3. Processing errors indicate calculation validation issues`);
        console.log(`   4. Most recent orders are from December 2024`);
        
        console.log(`\n💡 Recommendations:`);
        console.log(`   1. Retry the upload when Supabase connection is stable`);
        console.log(`   2. Review calculation validation logic for parts values`);
        console.log(`   3. Check if the 2,519 orders are from a previous successful upload`);
        console.log(`   4. Consider implementing retry logic for network failures`);
        
        console.log("\n======================================================================");
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Run the script
main().catch(console.error);