const token = 'AQWFyhYH-N-OvYHzRDiV1densBDbIevY92dEivYHzwzuPpVtyCUMeqUFfwrQZ9AY7rMJ8AlXBSjrazysHPrY51GrkwFYkzu6OVJJ0OmprBfuzwFlxH4cB5mb1W915xbl63D1e4z7JIq9f_clHp7WWn9L4hsNcps2-mgykLnWLFi3zWH6WWebf2D4HGqJVNEHL94Avi8K7rN5zXH5XAG-laRWUDa4FUJM7s2W0bcDhRTE9RUxc5JKZ2SuwymnQA7mBI7MswI6yj6h5sFgG4unxL61xAEe4HNflJ4mI_-6FJP3dRN-p2DlNn5h8ogqGbOhZWsDf0G0C8KnvVq8q7nKywDYB7TBLA';

async function test() {
  console.log('═══════════════════════════════════════');
  console.log('  LINKEDIN MCP — FULL FEATURE TEST');
  console.log('  API Version: 202603');
  console.log('═══════════════════════════════════════\n');

  const API_VER = '202603';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'LinkedIn-Version': API_VER,
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json'
  };

  // 1. USER INFO
  console.log('[1/5] GET USER INFO');
  let r = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { 'Authorization': headers['Authorization'] } });
  let d = await r.json();
  console.log(`  ${r.status} — ${d.name} (${d.sub})`);

  // 2. GET MY PROFILE (via userinfo since r_liteprofile deprecated)
  console.log('\n[2/5] GET MY PROFILE (OpenID fallback)');
  console.log(`  ✅ Name: ${d.name}, Email: ${d.email}, Picture: ${d.picture ? 'yes' : 'no'}`);

  // 3. CREATE + DELETE POST
  console.log('\n[3/5] CREATE POST');
  const author = `urn:li:person:${d.sub}`;
  r = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      author,
      commentary: 'Test @egistr/linkedin-mcp 🚀 (auto-deleted)',
      visibility: 'PUBLIC',
      lifecycleState: 'PUBLISHED',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }
    })
  });
  const postUrn = r.headers.get('x-restli-id') || r.headers.get('location') || '';
  console.log(`  POST: ${r.status}${r.status === 201 ? ' ✅' : ''}`);
  if (postUrn) console.log(`  URN: ${postUrn}`);
  else { const t = await r.text(); console.log(`  Response: ${t.substring(0, 200)}`); }

  // Delete if created
  if (r.status === 201 && postUrn) {
    console.log('\n  DELETE POST');
    // Strategy 1: /rest/posts/{encodedUrn} (LinkedIn REST API v202603)
    const encodedUrn = encodeURIComponent(postUrn);
    r = await fetch(`https://api.linkedin.com/rest/posts/${encodedUrn}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'X-RestLi-Method': 'DELETE'
      }
    });
    if (r.status !== 204) {
      // Strategy 2: /rest/entities/{encodedUrn} (entity endpoint)
      console.log(`  /rest/posts returned ${r.status}, trying /rest/entities...`);
      r = await fetch(`https://api.linkedin.com/rest/entities/${encodedUrn}`, {
        method: 'DELETE',
        headers
      });
    }
    console.log(`  DELETE: ${r.status}${r.status === 204 ? ' ✅' : ''}`);
  }

  // 4. IMAGE UPLOAD INIT
  console.log('\n[4/5] IMAGE UPLOAD INIT');
  r = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers,
    body: JSON.stringify({ initializeUploadRequest: { owner: author } })
  });
  console.log(`  ${r.status}${r.status === 201 ? ' ✅' : ''}`);
  if (r.status === 201) {
    d = await r.json();
    console.log(`  Upload URL: ${d.value?.uploadUrl ? '✓ received' : '✗ missing'}`);
    console.log(`  Image URN: ${d.value?.image || 'missing'}`);
  } else {
    const t = await r.text();
    console.log(`  ${t.substring(0, 200)}`);
  }

  // 5. LIST POSTS
  console.log('\n[5/5] LIST POSTS');
  // LinkedIn Rest.li requires q=author to identify the query type
  const listUrl = new URL('https://api.linkedin.com/rest/posts');
  listUrl.searchParams.set('q', 'author');
  listUrl.searchParams.set('author', author);
  listUrl.searchParams.set('count', '3');
  r = await fetch(listUrl.toString(), { headers });
  console.log(`  ${r.status}`);
  if (r.status === 200) { d = await r.json(); console.log(`  Posts: ${(d.elements || []).length}`); }
  else { const t = await r.text(); console.log(`  ${t.substring(0, 100)}`); }

  console.log('\n═══════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════\n');
}

test().catch(e => console.error('Fatal:', e));
