async function testConnection() {

  const { data, error } = await supabase
    .from('gallery')
    .select('*');

  console.log('data:', data);
  console.log('error:', error);

}

testConnection();