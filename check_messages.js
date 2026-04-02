
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahlgkhlnjcwmlbzfskoo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobGdraGxuamN3bWxiemZza29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzA1NDQsImV4cCI6MjA4OTIwNjU0NH0.wfNUI0G9aFZuYat1qwg0muf8C-uV81b6PUj7CdMcJek';

async function checkRecentMessages() {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log("🕵️ Verificando últimas mensagens na tabela messages...");
    
    const { data, error } = await sb
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Erro:', error.message);
    } else {
        console.log('✅ Últimas 5 mensagens:');
        console.log(JSON.stringify(data, null, 2));
    }
}

checkRecentMessages();
