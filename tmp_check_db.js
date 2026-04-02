
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read credentials
const creds = JSON.parse(fs.readFileSync('d:/Abel/Cupido Catolico/www/js/app.js', 'utf8').match(/window\.sb\s*=\s*supabase\.createClient\('(.*?)',\s*'(.*?)'\)/)[0].replace(/window\.sb\s*=\s*supabase\.createClient\('(.*?)',\s*'(.*?)'\)/, '$1|$2').split('|'));
const supabaseUrl = creds[0];
const supabaseKey = creds[1];

const sb = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await sb.from('profiles').select('*').limit(1);
  if (data && data[0]) {
    console.log("Columns:", Object.keys(data[0]));
    console.log("First row:", data[0]);
  } else {
    console.log("No data or error:", error);
  }
}

check();
