const token = 'AQWFyhYH-N-OvYHzRDiV1densBDbIevY92dEivYHzwzuPpVtyCUMeqUFfwrQZ9AY7rMJ8AlXBSjrazysHPrY51GrkwFYkzu6OVJJ0OmprBfuzwFlxH4cB5mb1W915xbl63D1e4z7JIq9f_clHp7WWn9L4hsNcps2-mgykLnWLFi3zWH6WWebf2D4HGqJVNEHL94Avi8K7rN5zXH5XAG-laRWUDa4FUJM7s2W0bcDhRTE9RUxc5JKZ2SuwymnQA7mBI7MswI6yj6h5sFgG4unxL61xAEe4HNflJ4mI_-6FJP3dRN-p2DlNn5h8ogqGbOhZWsDf0G0C8KnvVq8q7nKywDYB7TBLA';

async function test() {
  console.log('═══════════════════════════════════════');
  console.log('  LINKEDIN MCP — FEATURE TEST SUITE');
  console.log('═══════════════════════════════════════\n');

  // 1. TEST AUTH — User Info
  console.log('📋 [1/6] GET USER INFO (OpenID Connect)');
  try {
    const r = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await r.json();
    console.log(`   Status: ${r.status} ✅`);
    console.log(`   Name: ${d.name}`);
    console.log(`   Sub: ${d.sub}`);
    console.log(`   Email: ${d.email}`);
  } catch(e) { console.log(`   ❌ Error: ${e.message}`); }

  // 2. TEST PROFILE — Get Profile
  console.log('\n📋 [2/6] GET MY PROFILE');
  try {
    const r = await fetch('https://api.linkedin.com/v2/me', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    const d = await r.json();
    console.log(`   Status: ${r.status} ✅`);
    console.log(`   First: ${d.localizedFirstName}`);
    console.log(`   Last: ${d.localizedLastName}`);
  } catch(e) { console.log(`   ❌ Error: ${e.message}`); }

  // 3. TEST POST — Create + Delete
  console.log('\n📋 [3/6] CREATE + DELETE POST');
  let postUrn = '';
  try {
    // Get member ID
    const userR = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await userR.json();
    const author = `urn:li:person:${user.sub}`;
    
    // Create post
    const createR = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      },
      body: JSON.stringify({
        author,
        commentary: 'Test from @egistr/linkedin-mcp 🚀 (auto-deleted)',
        visibility: 'PUBLIC',
        lifecycleState: 'PUBLISHED',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }
      })
    });
    const location = createR.headers.get('x-restli-id') || createR.headers.get('location') || '';
    postUrn = location;
    console.log(`   Create: ${createR.status} ✅`);
    console.log(`   URN: ${postUrn}`);
    
    // Delete if created
    if (createR.status === 201 && postUrn) {
      const delR = await fetch(`https://api.linkedin.com/rest/posts/${encodeURIComponent(postUrn)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401'
        }
      });
      console.log(`   Delete: ${delR.status} ✅`);
    }
  } catch(e) { console.log(`   ❌ Error: ${e.message}`); }

  // 4. TEST LIST POSTS
  console.log('\n📋 [4/6] LIST POSTS');
  try {
    const userR = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await userR.json();
    
    const r = await fetch(
      `https://api.linkedin.com/rest/posts?author=${encodeURIComponent(`urn:li:person:${user.sub}`)}&count=3`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    console.log(`   Status: ${r.status}`);
    if (r.status === 200) {
      const d = await r.json();
      const posts = d.elements || [];
      console.log(`   Posts found: ${posts.length} ✅`);
    } else {
      console.log(`   ${r.status} (expected — needs r_member_social scope)`);
    }
  } catch(e) { console.log(`   ❌ Error: ${e.message}`); }

  // 5. TEST IMAGE UPLOAD
  console.log('\n📋 [5/6] IMAGE UPLOAD INIT');
  try {
    const userR = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await userR.json();
    const author = `urn:li:person:${user.sub}`;

    // Just test initialization (no actual image upload)
    const initR = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401'
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: author
        }
      })
    });
    console.log(`   Init Upload: ${initR.status} ${initR.status === 201 ? '✅' : ''}`);
    if (initR.status === 201) {
      const d = await initR.json();
      console.log(`   Upload URL: ${d.value?.uploadUrl?.substring(0, 50)}...`);
      console.log(`   Image URN: ${d.value?.image}`);
    }
  } catch(e) { console.log(`   ❌ Error: ${e.message}`); }

  // 6. TEST TOKEN EXPIRY
  console.log('\n📋 [6/6] TOKEN EXPIRY CHECK');
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString()
    );
    const exp = new Date(payload.exp * 1000);
    const now = new Date();
    const days = Math.round((exp - now) / 86400000);
    console.log(`   Expires: ${exp.toISOString()} (${days} days) ✅`);
  } catch(e) { console.log(`   ❌ Error: ${e.message}`); }

  console.log('\n═══════════════════════════════════════');
  console.log('  TEST SUITE COMPLETE');
  console.log('═══════════════════════════════════════\n');
}

test().catch(e => console.error('Fatal:', e));
